import os
import hashlib
import subprocess
import time


def get_file_hash(filepath):
    """Calculate the hash of a file."""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def compile_and_run(term):
    # check windows or linux
    compile_command = 'gcc main.c -lws2_32\n'
    run_command = "a.exe\n" if os.name == 'nt' else "./a.out\n"

    try:
        # Compile the C program
        print("Compilation successful.")
        
        # term.stdin.flush()
        # i want to run ctrl + c in the terminal to stop the previous process and run the new one
        term.stdin.write(compile_command)
        term.stdin.write(run_command)
        term.stdin.flush()

    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
    except FileNotFoundError:
        print("Error: Terminal emulator not found. Install 'x-terminal-emulator' or use a different terminal command.")

def main():
    filepath = "src/main.c"
    if not os.path.exists(filepath):
        print(f"{filepath} does not exist.")
        return

    last_hash = get_file_hash(filepath)
    print("Tracking changes to main.c...")

    term = None

    if os.name == 'nt':  # Windows
        term = subprocess.Popen(["cmd.exe"],
                                creationflags=subprocess.CREATE_NEW_CONSOLE,  # New visible terminal window
                                stdin=subprocess.PIPE,
                                text=True)
    else:  # macOS/Linux
        term = subprocess.Popen(["x-terminal-emulator", "-e"])

    time.sleep(1)  # Give the terminal some time to open
    term.stdin.write("cd src/\n")
    compile_and_run(term)

    while True:
        print("Checking for changes...")
        time.sleep(1)  # Check for changes every second
        current_hash = get_file_hash(filepath)
        if current_hash != last_hash:
            print("Change detected in main.c. Recompiling...")
            compile_and_run(term)
            last_hash = current_hash

if __name__ == "__main__":
    main()