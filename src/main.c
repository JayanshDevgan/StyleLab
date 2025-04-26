#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <winsock2.h>
#include <ws2tcpip.h>

#define PORT 6969
#define BUFFER_SIZE 1024
#define API_KEY ""

char* call_chatgpt(const char* prompt) {
    SOCKET sock;
    struct sockaddr_in server;
    char request[BUFFER_SIZE];
    char response[BUFFER_SIZE];
    char* result = NULL;

    // Create socket
    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) == INVALID_SOCKET) {
        fprintf(stderr, "Socket creation failed. Error Code: %d\n", WSAGetLastError());
        return NULL;
    }

    // Set up the server address
    server.sin_family = AF_INET;
    server.sin_port = htons(443);
    server.sin_addr.s_addr = inet_addr("104.18.31.100"); // This should be changed to use hostname

    // Connect to the server
    if (connect(sock, (struct sockaddr*)&server, sizeof(server)) < 0) {
        fprintf(stderr, "Connection failed. Error Code: %d\n", WSAGetLastError());
        closesocket(sock);
        return NULL;
    }

    // Prepare the request
    snprintf(request, sizeof(request),
        "POST /v1/chat/completions HTTP/1.1\r\n"
        "Host: api.openai.com\r\n"
        "Authorization: Bearer %s\r\n"
        "Content-Type: application/json\r\n"
        "Content-Length: %d\r\n"
        "\r\n"
        "{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"%s\"}]}",
        API_KEY, (int)strlen(prompt) + 70, prompt);

    // Send the request
    if (send(sock, request, strlen(request), 0) < 0) {
        fprintf(stderr, "Send failed. Error Code: %d\n", WSAGetLastError());
        closesocket(sock);
        return NULL;
    }

    // Receive the response
    int bytes_received = recv(sock, response, sizeof(response) - 1, 0);
    if (bytes_received > 0) {
        response[bytes_received] = '\0';
        result = strdup(response);
    } else {
        fprintf(stderr, "Receive failed. Error Code: %d\n", WSAGetLastError());
    }

    closesocket(sock);
    return result;
}

void handle_chat_request(SOCKET client_socket, const char* user_input) {
    char* chatgpt_response = call_chatgpt(user_input);
    
    const char* response_header = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n";
    send(client_socket, response_header, strlen(response_header), 0);
    
    if (chatgpt_response) {
        send(client_socket, chatgpt_response, strlen(chatgpt_response), 0);
        free(chatgpt_response);
    } else {
        const char* error_response = "Error calling ChatGPT API.";
        send(client_socket, error_response, strlen(error_response), 0);
    }
}

int main() {
    WSADATA wsaData;
    SOCKET server_fd, new_socket;
    
    struct sockaddr_in address;
    int addrlen = sizeof(address); 

    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        printf("WSAStartup failed\n");
        return 1;
    }

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == INVALID_SOCKET) { 
        printf("Socket creation failed\n");
        WSACleanup();
        return 1;
    }

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) == SOCKET_ERROR) {
        printf("Bind failed\n");
        closesocket(server_fd);
        WSACleanup();
        return 1;
    }

    if (listen(server_fd, 3) == SOCKET_ERROR) {
        printf("Listen failed\n");
        closesocket(server_fd);
        WSACleanup();
        return 1;
    }

    printf("Server listening on port %d\n", PORT);

    while (1) {
        if ((new_socket = accept(server_fd, (struct sockaddr *)&address, &addrlen)) == INVALID_SOCKET) {
            printf("Accept failed\n");
            continue;
        }
        
        char buffer[BUFFER_SIZE] = {0};
        recv(new_socket, buffer, BUFFER_SIZE, 0);
        printf("%s\n", buffer);
        
        printf("Before user_input\n");
        char* user_input = strstr(buffer, "GET /?prompt=") + 13;
        printf("after user_input\n");
        char* end = strchr(user_input, ' ');
        
        // Decode URL-encoded input
        char decoded_input[BUFFER_SIZE];
        int j = 0;
        for (int i = 0; user_input[i] != '\0'; i++) {
            if (user_input[i] == '%') {
                int value;
                sscanf(user_input + i + 1, "%2x", &value);
                decoded_input[j++] = (char)value;
                i += 2;
            } else if (user_input[i] == '+') {
                decoded_input[j++] = ' ';
            } else {
                decoded_input[j++] = user_input[i];
            }
        }
        decoded_input[j] = '\0';

        handle_chat_request(new_socket, decoded_input);
        closesocket(new_socket);
    }
    printf("Server shutting down...\n");

    closesocket(server_fd);
    WSACleanup();
    return 0;        
}