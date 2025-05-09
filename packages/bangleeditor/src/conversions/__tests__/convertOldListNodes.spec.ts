import { _, jsonDoc } from '@packages/bangleeditor/builders';

import { convertDocument } from '../convertOldListNodes';

describe('Doc conversion: old list nodes', () => {
  it('Should not produce any steps for a normal list', () => {
    const content = _.doc(
      _.bullet_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables')))
    );
    const { steps } = convertDocument(content);
    expect(steps).toEqual([]);
  });
  it('Should produce one step for an old list', () => {
    const content = _.doc(_.bulletList(_.listItem(_.p('Bread'))));
    const { steps } = convertDocument(content);
    expect(steps).toHaveLength(1);
  });

  it('Should produce two steps for two old lists', () => {
    const content = _.doc(_.bulletList(_.listItem(_.p('Bread'))), _.bulletList(_.listItem(_.p('Bread'))));
    const { steps } = convertDocument(content);
    expect(steps).toHaveLength(2);
  });

  it('Should properly convert an old bullet list', () => {
    const oldListDoc = _.doc(
      _.bulletList(
        _.listItem(_.p('Bread')),
        _.listItem(_.p('Milk')),
        _.listItem(
          _.p('Vegetables'),
          _.bulletList(
            _.listItem(_.p('Cucumber')),
            _.listItem(
              _.p('Pumpkin'),
              _.bulletList(_.listItem(_.p('Squash'), _.bulletList(_.listItem(_.p('Zucchini')))))
            )
          )
        )
      )
    );
    const newListDoc = _.doc(
      _.bullet_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
      _.bullet_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
      _.bullet_list({ indent: 2 }, _.list_item(_.p('Squash'))),
      _.bullet_list({ indent: 3 }, _.list_item(_.p('Zucchini')))
    );
    const { doc } = convertDocument(oldListDoc);
    // console.log(JSON.stringify(newListDoc.toJSON(), null, 2));
    // console.log(JSON.stringify(doc.toJSON(), null, 2));
    expect(JSON.stringify(doc.toJSON(), null, 2)).toEqual(JSON.stringify(newListDoc.toJSON(), null, 2));
  });

  it('Should properly convert an old ordered list', () => {
    const oldListDoc = _.doc(
      _.orderedList(
        _.listItem(_.p('Bread')),
        _.listItem(_.p('Milk')),
        _.listItem(
          _.p('Vegetables'),
          _.orderedList(
            _.listItem(_.p('Cucumber')),
            _.listItem(
              _.p('Pumpkin'),
              _.orderedList(_.listItem(_.p('Squash'), _.orderedList(_.listItem(_.p('Zucchini')))))
            )
          )
        )
      )
    );
    const newListDoc = _.doc(
      _.ordered_list(_.list_item(_.p('Bread')), _.list_item(_.p('Milk')), _.list_item(_.p('Vegetables'))),
      _.ordered_list({ indent: 1 }, _.list_item(_.p('Cucumber')), _.list_item(_.p('Pumpkin'))),
      _.ordered_list({ indent: 2 }, _.list_item(_.p('Squash'))),
      _.ordered_list({ indent: 3 }, _.list_item(_.p('Zucchini')))
    );
    const { doc } = convertDocument(oldListDoc);
    expect(JSON.stringify(doc.toJSON(), null, 2)).toEqual(JSON.stringify(newListDoc.toJSON(), null, 2));
  });
});
