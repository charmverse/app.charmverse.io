import { DateTime } from 'luxon';
import { faker } from '@faker-js/faker';

export function randomTimeOfDay(date: DateTime) {
  // Check if date is today, then set the time to a random time today not in the future
  if (date.hasSame(DateTime.now(), 'day')) {
    return date.set({
      minute: faker.number.int({ min: 0, max: date.minute }),
      hour: faker.number.int({ min: 0, max: date.hour }),
      second: faker.number.int({ min: 0, max: date.second })
    });
  }

  return date.set({
    minute: faker.number.int({ min: 0, max: 59 }),
    hour: faker.number.int({ min: 0, max: 23 }),
    second: faker.number.int({ min: 0, max: 59 })
  });
}
