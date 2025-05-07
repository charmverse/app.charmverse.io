export const sampleTypeformResponse = {
  event_id: '01H5320DBGJF8PEJNWTN565S0A',
  event_type: 'form_response',
  form_response: {
    form_id: 'r7kCCJJp',
    token: '01H5320DBGJF8PEJNWTN565S0A',
    landed_at: '2023-07-11T18:04:23Z',
    submitted_at: '2023-07-11T18:04:23Z',
    definition: {
      id: 'r7kCCJJp',
      title: 'Webhook testing',
      fields: [
        {
          id: '8JlcraTyioxv',
          ref: '01H531GWT0DN41H4C16PFP05NS',
          type: 'short_text',
          title: "Hello, what's your name?",
          properties: {}
        },
        {
          id: 'sKA7t1hYYVGX',
          ref: '01H531GWVKAT474T5MS32VKKS9',
          type: 'multiple_choice',
          title: 'Nice to meet you, {{field:01H531GWT0DN41H4C16PFP05NS}}, how is your day going?',
          properties: {},
          choices: [
            {
              id: 'hYorZ9YweWhP',
              label: 'Terrific!'
            },
            {
              id: 'rXSf6v3tVel8',
              label: 'Not so well...'
            }
          ]
        }
      ],
      endings: [
        {
          id: 'DefaultTyScreen',
          ref: 'default_tys',
          title: "Thanks for completing this typeform\nNow *create your own* — it's free, easy, & beautiful",
          type: 'thankyou_screen',
          properties: {
            button_text: 'Create a *typeform*',
            show_button: true,
            share_icons: false,
            button_mode: 'default_redirect'
          },
          attachment: {
            type: 'image',
            href: 'https://images.typeform.com/images/2dpnUBBkz2VN'
          }
        }
      ]
    },
    answers: [
      {
        type: 'text',
        text: 'Lorem ipsum dolor',
        field: {
          id: '8JlcraTyioxv',
          type: 'short_text',
          ref: '01H531GWT0DN41H4C16PFP05NS'
        }
      },
      {
        type: 'choice',
        choice: {
          label: 'Barcelona'
        },
        field: {
          id: 'sKA7t1hYYVGX',
          type: 'multiple_choice',
          ref: '01H531GWVKAT474T5MS32VKKS9'
        }
      }
    ],
    ending: {
      id: 'DefaultTyScreen',
      ref: 'default_tys'
    }
  }
};
