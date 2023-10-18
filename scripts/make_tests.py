#!/usr/bin/env python3

import os
import sys
import subprocess
import webbrowser

import time

defaukt_api_test="""
import type { Application, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsRandom, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { ApplicationWithTransactions, Reward } from 'lib/rewards/interfaces';
import type { WorkUpsertData } from 'lib/rewards/work';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty } from 'testing/setupDatabase';

describe('PUT /api/reward-applications/work - work on a reward', () => {
  let space: Space;
  let admin: User;
  let user: User;
  let userCookie: string;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    admin = generated.user;
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    userCookie = await loginUser(user.id);
  });

  it('should allow user with permissions to create and update work, and receive their application with a 200', async () => {
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const workContent: Partial<WorkUpsertData> = {
      message: 'Applying to work',
      submissionNodes: '',
      submission: '',
      rewardInfo: 'Fedex please',
      walletAddress: testUtilsRandom.randomETHWallet().address
    };

    const createdApplication = (
      await request(baseUrl)
        .put(`/api/reward-applications/work`)
        .set('Cookie', userCookie)
        .send({ ...workContent, rewardId: reward.id })
        .expect(200)
    ).body;

    expect(createdApplication).toMatchObject(expect.objectContaining<Partial<Application>>(workContent));

    const submissionUpdate: WorkUpsertData = {
      rewardId: reward.id,
      userId: user.id,
      submission: 'New content'
    };

    const updatedApplication = (
      await request(baseUrl)
        .put(`/api/reward-applications/work?applicationId=${createdApplication.id}`)
        .set('Cookie', userCookie)
        .send(submissionUpdate)
        .expect(200)
    ).body;

    expect(updatedApplication).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        ...createdApplication,
        submission: submissionUpdate.submission
      })
    );
  });

  it('should only allow users with correct role to create work, if the reward is restricted to certain roles, and respond 200 or 401', async () => {
    const reward = await generateBounty({
      createdBy: admin.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const memberWithRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const submitterRole = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      assigneeUserIds: [memberWithRole.id]
    });

    await prisma.bountyPermission.create({
      data: {
        permissionLevel: 'submitter',
        bounty: { connect: { id: reward.id } },
        role: { connect: { id: submitterRole.id } }
      }
    });

    const workContent: Partial<WorkUpsertData> = {
      message: 'Applying to work',
      submissionNodes: '',
      submission: '',
      rewardInfo: 'Fedex please',
      walletAddress: testUtilsRandom.randomETHWallet().address,
      rewardId: reward.id
    };

    // Case where this works
    const memberWithRoleCookie = await loginUser(memberWithRole.id);

    await request(baseUrl)
      .put(`/api/reward-applications/work`)
      .set('Cookie', memberWithRoleCookie)
      .send(workContent)
      .expect(200);

    await request(baseUrl).put(`/api/reward-applications/work`).set('Cookie', userCookie).send(workContent).expect(401);
  });

  it('should prevent a user without permissions from working on this reward, and respond with 401', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 1
    });

    const workContent = {
      rewardId: reward.id
    };

    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);

    await request(baseUrl)
      .put(`/api/reward-applications/work`)
      .set('Cookie', otherUserCookie)
      .send(workContent)
      .expect(401);
  });
});
"""

default_unit_test="""
import type { Application } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { DuplicateDataError, InvalidInputError, LimitReachedError, WrongStateError } from 'lib/utilities/errors';
import { generateBounty, generateUserAndSpace } from 'testing/setupDatabase';
import type { WorkUpsertData } from '../work';
import { work } from '../work';

let user: any;
let space: any;

beforeAll(async () => {
  ({ user, space } = await generateUserAndSpace());
});

describe('work', () => {
  const genApplicationData = (overwrites: Partial<WorkUpsertData> = {}): WorkUpsertData => ({
    userId: user.id,
    message: 'Sample message',
    submission: 'Sample submission',
    submissionNodes: '{}',
    ...overwrites
  });

  it('should create an application if reward requires applications, and a submission if not', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 5
    });

    const applicationData: WorkUpsertData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}'
    };

    const application = await work(applicationData);

    expect(application).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'applied',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );

    // If user applies at a time where approveSubmitters is false
    await prisma.bounty.update({
      where: {
        id: reward.id
      },
      data: {
        approveSubmitters: false
      }
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const submission = await work({ ...applicationData, userId: spaceMember.id });

    expect(submission).toMatchObject(
      expect.objectContaining<Partial<Application>>({
        status: 'inProgress',
        acceptedBy: null, // you might want to fill in specific values here if necessary
        bountyId: expect.any(String), // assuming it's a string type, adjust if needed
        createdAt: expect.any(Date),
        createdBy: expect.any(String), // adjust type if needed
        id: expect.any(String),
        message: expect.any(String),
        reviewedBy: null, // or expect.any(String) if it's supposed to be a string
        spaceId: expect.any(String),
        submission: expect.any(String),
        submissionNodes: expect.any(String), // this is the stringified JSON or regular string
        updatedAt: expect.any(Date),
        walletAddress: null // or expect.any(String) if it's supposed to be a string
      })
    );
  });

 it('should fail if Submission cap reached', async () => {
    const reward = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: true,
      maxSubmissions: 2,
      allowMultipleApplications: true
    });

    const applicationData = {
      userId: user.id,
      rewardId: reward.id,
      message: 'Sample message for testing',
      submission: 'Sample submission data',
      submissionNodes: '{}',
      status: 'applied'
    };

    // Cap is reached when enough reward submissions are marked as complete
    await prisma.application.createMany({
      data: [1, 2, 3, 4].map(() => ({ bountyId: reward.id, createdBy: user.id, spaceId: space.id, status: 'complete' }))
    });

    await expect(work(applicationData)).rejects.toThrow(LimitReachedError);
  });
});
"""


def get_absolute_path(relative_path):
    """Get the absolute path based on the script's location."""
    script_dir = os.path.dirname(os.path.realpath(__file__)).replace('scripts', '')
    return os.path.join(script_dir, relative_path)


system_prompt="""
You are a Senior Software Engineer working for CharmVerse on a Rewards project.
Your goal is to help me write tests and review our code.
Prisma is the postgres ORM.
"""


project_brief="""
You are working on the Rewards project.

The goal of this project is to allow space members to create rewards, have users work on them, review their work and pay for it.
"""


common_generators = """
For writing tests,

These common generators can help you

import { testUtilsMembers, testUtilsRandom, testUtilsUser } from '@charmverse/core/test';

const {user, space} = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

testUtilsMembers.generateRole({
  createdBy: admin.id,
  spaceId: space.id,
  assigneeUserIds: [memberWithRole.id]
});
testUtilsUser.generateSpaceUser({ spaceId: space.id });

testUtilsMembers.generateRole({
    createdBy: user.id,
    spaceId: space.id
  });

import { generateBounty } from 'testing/setupDatabase';

const reward = await generateBounty({
  approveSubmitters: false,
  createdBy: user.id,
  spaceId: space.id,
  status: 'open',
  maxSubmissions: 1
});
"""

final_instruction=""""
Only write the code if I confirm. If you have any questions, ask me before you write the code

Never mock unless asked to. Use generators or prisma directly. Generate basic test data inside describe blocks. Make each unit test from state of other tests when the test would mutate data

Always confirm Success and Error cases with me before writing code

Once I confirm, DO NOT SEND ANYTHING ELSE THAN CODE IN YOUR RESPONSE

I want to be able to copy your generated code into Jest.

Once you generate code, the success cases should be before the error cases.
"""

def get_base_prompt():
  return f"""
  {system_prompt}

  {project_brief}

  {common_generators}
  """



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


#  Example usage:
#  unit_test('./lib/applications/actions/createApplication.ts')
def unit_test(code_to_test_path, example_tests):
    if not example_tests:
      example_tests = default_unit_test

    with open(code_to_test_path, 'r') as file:
      code_to_test = file.read()

    prompt = f"""
    {get_base_prompt()}

    We are writing Unit Tests.
    Unit tests should follow the MECE principle and test Mutually Exclusive, Collectively Exhaustive success and error conditions,

    Success cases
    - What given output to get for the input
    - Alternative behaviours based on parameters

    Error cases
    - Invalid input
    // Any others you think are relevant

    Success and error cases for this function using Jest and Typescript.

    When your test imports the function to test, assume the filename is written in the same way, and one level above ie functionToTest becomes
    
    import functionToTest from '../functionToTest'

    This is what a Unit Test looks like, indicated by ---------

    ---------

    {example_tests}

    ---------

    Here is the code we need to test, indicated by ++++++++++

    ++++++++++

    {code_to_test}

    ++++++++++

    {final_instruction}

    """

    # Copy the prompt to the system clipboard

    # Replace pyperclip.copy(prompt) with:
    return prompt

def api_test(code_to_test_path, example_tests=""):

    with open(code_to_test_path, 'r') as file:
      code_to_test = file.read()

    # If example is not provided, attempt to read it from the file
    if not example_tests:
        default_example_path = get_absolute_path("__integration-tests__/server/pages/api/reward-applications/work.spec.ts")

        print("Using default API Test example", default_example_path)
        with open(default_example_path, 'r') as file:
            example = file.read()



    prompt = f"""
    {get_base_prompt()}
    
    Your task is to write API tests.
    API tests look for the status code, and shape of the response in case of success

    Always write these 2 cases.

    Case 1 - User with permissions (usually status code 200 or 201)

    Case 2 - User without permissions (usually status code 401)

    Add an extra case if you think it makes sense

    ///////////
    This is what an API Integration Test looks like
    {example}

    ////////////

    Here is the code we need to test

    If you find multiple API handler functions, create 1 jest "describe" tests block per handler

    {code_to_test}

    ////////////

    First inform me which test cases you want to write.

    Only write the code if I confirm. If you have any questions, ask me before you write the code

    Once I confirm, DO NOT SEND ANYTHING ELSE THAN CODE IN YOUR RESPONSE

    I want to be able to copy your generated code into Jest.

    When your test imports the function to test, assume the filename is written in the same way, and one level above ie '../functionToTest'

    If you need a user or space, use generateUserAndSpace() which returns an object with user and space properties

    Each test should be phrased as "it("should return X with a status code Y if user has permission / no permission", async() => )

    {common_generators}


    API TEST-specific generators
    loginUser(normalMember.id)

    {final_instruction}
    """

    # Copy the prompt to the system clipboard

    # Replace pyperclip.copy(prompt) with:
    return prompt


def main():
    print("Welcome to the Rewards Project Test Suite!")
    
    link = input("Enter the link of the library to write tests for: ")

    test_types = ["unit", "API", "E2E"]
    
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

    confirm = input("Open ChatGPT? y/n")

    if confirm == "y" or confirm == "yes":
      print("Opening browser")
      # New conversation
      # webbrowser.open_new_tab("https://chat.openai.com/")
      #  
      # Ongoing conversation
      # Replace by a custom conversation if you want
      webbrowser.open_new_tab("https://chat.openai.com/c/65d696f8-37f2-47fe-8e93-ab57cb300fbe")

    else:
      print("Goodbye for now")


  

def load_instructions(test_type, code_to_test_path, example_tests=None):
    if (test_type == "unit"):
      return unit_test(code_to_test_path=code_to_test_path, example_tests=example_tests)

    elif (test_type == "API"):
      return api_test(code_to_test_path=code_to_test_path, example_tests=example_tests)

    # Dummy function, you can expand this with actual instructions
    return f"Invalid input"

print(__name__)

if __name__ == "__main__":
    main()



