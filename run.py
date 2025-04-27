import subprocess

def run_command(command):
    try:
        # Open a new mac terminal window and run the command
        
        subprocess.run(['osascript', '-e', f'tell application "Terminal" to do script "{command}"'], check=True)
    except subprocess.CalledProcessError as e:
        print("Error:\n", e.stderr)

if __name__ == "__main__":
    command = "cd /Users/mandeepsingh/MyStuff/Programming/StyleLab\n"
    command += "node src/Scripts/server.js"
    run_command(command)