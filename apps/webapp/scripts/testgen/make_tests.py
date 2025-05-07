#!/usr/bin/env python3

import os
import sys
import subprocess
import webbrowser

import time

from prompts.base import base_prompt, common_generators
from prompts.unit import unit_test_prompt
from prompts.api import api_test_prompt


def get_absolute_path(relative_path):
    """Get the absolute path based on the script's location."""
    script_dir = os.path.dirname(os.path.realpath(__file__)).replace('/scripts/testgen', '')
    return os.path.join(script_dir, relative_path)


def sleep(s=2):
  time.sleep(s)  # Sleeps for 2 seconds
  print("Finished after 2 seconds!")

def copy_to_clipboard(text):
    try:
        platform = sys.platform
        if platform == "win32":
            # Windows
            process = subprocess.Popen(['clip'], stdin=subprocess.PIPE, text=True)
            process.communicate(text)
        elif platform == "darwin":
            # MacOS
            process = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE, text=True)
            process.communicate(text)
        else:
            # Linux (requires xclip to be installed)
            process = subprocess.Popen(['xclip', '-selection', 'clipboard'], stdin=subprocess.PIPE, text=True)
            process.communicate(text)
    except Exception as e:
        print(f"Failed to copy to clipboard: {e}")

def create_test_file(full_path):
    instructions = f"""
\033[101m\033[97m\033[1mFailed to create test file. Here is a potential fix.\033[0m

1. Open VSCode.
2. Press Cmd + Shift + P (on macOS) or Ctrl + Shift + P (on other platforms) to open the command palette.
3. Type Shell Command: Install 'code' command in PATH and select it.
4. This will add the code command to your shell's PATH
    """

    try:
      subprocess.run(["code", full_path])
      print(f"Created test file at {full_path}")
    except FileNotFoundError as e:
      print(e, '\n\n', instructions)
    # Handle the error, perhaps notifying the user or logging the issue



def create_unit_test_file(link):
    """Generate test file path and create an empty test file."""
    dir_path, filename = os.path.split(link)
    base, ext = os.path.splitext(filename)
    
    test_directory = os.path.join(dir_path, "__tests__")
    test_filename = f"{base}.spec{ext}"
    test_filepath = os.path.join(test_directory, test_filename)
    
    if not os.path.exists(test_filepath):
      os.makedirs(test_directory, exist_ok=True)
      
      with open(test_filepath, 'w') as f:
          pass  # Just create an empty file

    create_test_file(test_filepath)


def create_api_test_file(link):
    """Generate API test file path and create an empty test file if it doesn't exist."""
    
    # Construct the path to the integration tests directory based on the provided link
    test_directory = os.path.join("__integration-tests__/server", os.path.dirname(link))
    base, ext = os.path.splitext(os.path.basename(link))
    test_filename = f"{base}.spec{ext}"
    test_filepath = os.path.join(test_directory, test_filename)
    
    # Check if the test file already exists. If not, create it
    if not os.path.exists(test_filepath):
        os.makedirs(test_directory, exist_ok=True)
        with open(test_filepath, 'w') as f:
            pass  # Just create an empty file
        print(f"Created API test file at {test_filepath}")
    else:
        print(f"API test file already exists at {test_filepath}")

    create_test_file(test_filepath)



def main():
    print("Welcome to the Rewards Project Test Suite!")
    
    link = input("Enter the link of the library to write tests for: ")

    test_types = ["unit", "API"]
    
    print("Available test types:")

    for idx, test_type in enumerate(test_types, 1):
        print(f"{idx}. {test_type}")
    selected_type = int(input("Select test type by number: "))
    
    if selected_type not in range(1, len(test_types) + 1):
        print("Invalid selection.")
        return
    
    type_name = test_types[selected_type - 1]

    file_link = get_absolute_path(link)

    print(file_link)

    if type_name == "API":
      create_api_test_file(link)
    elif type_name == "unit":
      create_unit_test_file(link)
      
    # Readd custom examples later if needed. For now we can just improve the prompt example for each test time
    # 
    # example = input("Provide an optional example (leave blank to skip): ")
    # if example:
    #     print(f"Example received, I will include it")
    
    # Load instructions based on user choice
    assistant_instructions = load_instructions(test_type=type_name, code_to_test_path=file_link)

    copy_to_clipboard(assistant_instructions)

    print("Copied prompt to clipboard")

    confirm = input("Open ChatGPT? y/n: ")

    if confirm == "y" or confirm == "yes":
      print("Opening browser")
      # New conversation
      webbrowser.open_new_tab("https://chat.openai.com/")
      #  
      # Ongoing conversation
      # Replace by a custom conversation if you want
      # webbrowser.open_new_tab("https://chat.openai.com/c/65d696f8-37f2-47fe-8e93-ab57cb300fbe")

    else:
      print("Goodbye for now")


def load_instructions(test_type, code_to_test_path, example_tests=None):
    
    with open(code_to_test_path, 'r') as file:
      code_to_test = file.read()


    test_type_instructions = """"""

    if (test_type == "unit"):
      test_type_instructions = unit_test_prompt()

    elif (test_type == "API"):
      test_type_instructions = api_test_prompt()
  
    
    test_prompt = f"""
    {base_prompt}

    {common_generators}

    {test_type_instructions}

    Here is the code to test, indicated by /////////////


    /////////////

    {code_to_test}

    /////////////

    Only write the code if I confirm. If you have any questions, ask me before you write the code

    Never mock unless asked to. Use generators or prisma directly. Generate basic test data inside describe blocks. Make each unit test independent from state of other tests when the test would mutate data

    Always confirm Success and Error cases with me before writing code

    Once I confirm, DO NOT SEND ANYTHING ELSE THAN CODE IN YOUR RESPONSE

    I want to be able to copy your generated code into Jest.

    Once you generate code, the success cases should be before the error cases.

    """

    return test_prompt   

    # Dummy function, you can expand this with actual instructions
    return f"Invalid input"

print(__name__)

if __name__ == "__main__":
    main()



