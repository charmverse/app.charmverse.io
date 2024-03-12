from examples.unit import unit_test_example

def unit_test_prompt ():
    return f"""
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

    {unit_test_example}

    ---------
"""
 