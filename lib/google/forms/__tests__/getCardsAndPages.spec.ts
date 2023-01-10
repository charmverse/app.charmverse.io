import type * as googlForms from '@googleapis/forms';

import { getCardProperties } from '../getCardsAndPages';

type GoogleForm = googlForms.forms_v1.Schema$Form;

const testForm: GoogleForm = {
  items: [
    {
      itemId: '566e7f1c',
      title: 'Multiple choice question',
      questionItem: {
        question: {
          questionId: '6520bee9',
          choiceQuestion: {
            type: 'RADIO',
            options: [
              {
                value: 'Option 1'
              },
              {
                value: 'Option 2'
              },
              {
                value: 'Option 3'
              }
            ]
          }
        }
      }
    },
    {
      itemId: '5a026959',
      title: 'Multiple choice with other',
      questionItem: {
        question: {
          questionId: '0ca82e53',
          choiceQuestion: {
            type: 'RADIO',
            options: [
              {
                value: 'Option 1'
              },
              {
                isOther: true
              }
            ]
          }
        }
      }
    },
    {
      itemId: '1c41d739',
      title: 'Paragraph answer question',
      questionItem: {
        question: {
          questionId: '0647aa89',
          textQuestion: {
            paragraph: true
          }
        }
      }
    },
    {
      itemId: '5967183b',
      title: 'Short answer question',
      questionItem: {
        question: {
          questionId: '30d2ae01',
          textQuestion: {}
        }
      }
    },
    {
      itemId: '2aae5c84',
      title: 'Checkboxes question: google search',
      questionItem: {
        question: {
          questionId: '0cc9983a',
          choiceQuestion: {
            type: 'CHECKBOX',
            options: [
              {
                value: 'Option 1'
              },
              {
                value: 'Option 2'
              }
            ]
          }
        }
      }
    },
    {
      itemId: '02da5679',
      title: 'Dropdown question',
      questionItem: {
        question: {
          questionId: '23bfae85',
          choiceQuestion: {
            type: 'DROP_DOWN',
            options: [
              {
                value: 'Option 1'
              }
            ]
          }
        }
      }
    },
    {
      itemId: '0630ac35',
      title: 'File upload question',
      questionItem: {
        question: {
          questionId: '000f4241',
          fileUploadQuestion: {
            folderId: '1zocw6qVJTnMJnYYEcYh0vGY63Q2mP0W4j9wozppCQcxp0aD8rlnFeak_aUL8RcpTIcteoa1t',
            types: ['ANY'],
            maxFiles: 1,
            maxFileSize: '10485760'
          }
        }
      }
    },
    {
      itemId: '0e745d10',
      title: 'Linear scale',
      questionItem: {
        question: {
          questionId: '32d780fe',
          scaleQuestion: {
            low: 1,
            high: 5,
            lowLabel: 'label  for 1',
            highLabel: 'label for 5'
          }
        }
      }
    },
    {
      itemId: '4fe67b3d',
      questionGroupItem: {
        questions: [
          {
            questionId: '598723b8',
            rowQuestion: {
              title: 'Row 1'
            }
          },
          {
            questionId: '1a2fed0b',
            rowQuestion: {
              title: 'Row 2'
            }
          },
          {
            questionId: '3da95e85',
            rowQuestion: {
              title: 'Row 3'
            }
          }
        ],
        grid: {
          columns: {
            type: 'RADIO',
            options: [
              {
                value: 'Column 1'
              },
              {
                value: 'Column 2'
              }
            ]
          }
        }
      },
      title: 'Multiple choice grid'
    },
    {
      itemId: '2a4805c9',
      questionGroupItem: {
        questions: [
          {
            questionId: '02632982',
            rowQuestion: {
              title: 'Checkbox Row 1'
            }
          },
          {
            questionId: '4f481484',
            rowQuestion: {
              title: 'Checkbox Row 2'
            }
          }
        ],
        grid: {
          columns: {
            type: 'CHECKBOX',
            options: [
              {
                value: 'Checkbox Column 1'
              },
              {
                value: 'Checkbox Column 2'
              }
            ]
          }
        }
      },
      title: 'Checkbox grid'
    },
    {
      itemId: '43b2947b',
      title: 'Date with year',
      questionItem: {
        question: {
          questionId: '24377e85',
          dateQuestion: {
            includeYear: true
          }
        }
      }
    },
    {
      itemId: '461120bf',
      title: 'Time question',
      questionItem: {
        question: {
          questionId: '57fd7318',
          timeQuestion: {}
        }
      }
    }
  ]
};

describe('getCardProperties()', () => {
  it('parses different types of questions', () => {
    const cardProperties = getCardProperties(testForm);

    // add 3 to account for the extra questions inside of questionGroupItems
    expect(cardProperties.length).toBe(testForm.items!.length + 3 + 1);
    expect(cardProperties[0]).toEqual(expect.objectContaining({ id: 'response_link' }));
    expect(cardProperties[1]).toEqual(expect.objectContaining({ type: 'select', name: 'Multiple choice question' }));
    expect(cardProperties[2]).toEqual(expect.objectContaining({ type: 'text', name: 'Multiple choice with other' }));
    expect(cardProperties[3]).toEqual(expect.objectContaining({ type: 'text', name: 'Paragraph answer question' }));

    expect(cardProperties[4]).toEqual(expect.objectContaining({ type: 'text', name: 'Short answer question' }));

    expect(cardProperties[5]).toEqual(
      expect.objectContaining({
        type: 'multiSelect',
        name: 'Checkboxes question: google search',
        options: expect.arrayContaining([
          { color: '', id: 'Option 1', value: 'Option 1' },
          { color: '', id: 'Option 2', value: 'Option 2' }
        ])
      })
    );
    expect(cardProperties[6]).toEqual(
      expect.objectContaining({
        type: 'select',
        name: 'Dropdown question',
        options: expect.arrayContaining([{ color: '', id: 'Option 1', value: 'Option 1' }])
      })
    );
    expect(cardProperties[7]).toEqual(expect.objectContaining({ type: 'text', name: 'File upload question' }));
    expect(cardProperties[8]).toEqual(expect.objectContaining({ type: 'text', name: 'Linear scale' }));
    expect(cardProperties[9]).toEqual(expect.objectContaining({ type: 'select', name: 'Multiple choice grid: Row 1' }));
    expect(cardProperties[10]).toEqual(
      expect.objectContaining({ type: 'select', name: 'Multiple choice grid: Row 2' })
    );
    expect(cardProperties[11]).toEqual(
      expect.objectContaining({ type: 'select', name: 'Multiple choice grid: Row 3' })
    );
    expect(cardProperties[12]).toEqual(
      expect.objectContaining({ type: 'multiSelect', name: 'Checkbox grid: Checkbox Row 1' })
    );
    expect(cardProperties[13]).toEqual(
      expect.objectContaining({ type: 'multiSelect', name: 'Checkbox grid: Checkbox Row 2' })
    );
    expect(cardProperties[14]).toEqual(expect.objectContaining({ type: 'date', name: 'Date with year' }));
    expect(cardProperties[15]).toEqual(expect.objectContaining({ type: 'text', name: 'Time question' }));
  });
});
