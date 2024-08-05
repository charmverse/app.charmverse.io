from examples.api import api_test_example

def api_test_prompt ():
  return f"""
   Your task is to write API tests.
    API tests look for the status code, and shape of the response in case of success

    Always write these 2 cases.

    Case 1 - User with permissions (usually status code 200 or 201)

    Case 2 - User without permissions (usually status code 401)

    Add an extra case if you think it makes sense

    If you find multiple API handler functions, create 1 jest "describe" tests block per handler

    This is what an APU Test looks like, indicated by ---------

    ---------

    {api_test_example}

    ---------
"""