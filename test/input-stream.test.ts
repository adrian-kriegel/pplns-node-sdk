
import { DataItem } from '@pplns/schemas';
import {
  prepareBundle,
} from '../src/input-stream';

test('prepareBundle', () => 
{
  // TODO: more tests

  type BundleMin = Parameters<typeof prepareBundle>[0];

  const itemBox : DataItem = 
  {
    _id: 'itemId-box',
    done: true,
    flowId: 'img0333.jpg',
    nodeId: '632db03e2c80db1268b765d7',
    outputChannel: 'file',
    taskId: '632da853feaaabbd8a224d72',
    createdAt: '2022-09-24T10:26:13.728Z',
    data: ['data-box'],
    flowStack: [],
    producerNodeIds: [],
    consumptionId: null,
  };

  const itemImg : DataItem = 
  {
    _id: 'itemId-img',
    done: true,
    flowId: '632f098a191fa419e5f8c3c2',
    nodeId: '632db0502c80db1268b765d9',
    outputChannel: 'out',
    taskId: '632da853feaaabbd8a224d72',
    createdAt: '2022-09-24T13:43:38.343Z',
    data: ['data-image'],
    flowStack: [],
    producerNodeIds: [],
    consumptionId: null,
  };
  
  const bundle : BundleMin = 
  {
    inputItems: [
      {
        position: 1,
        itemId: 'itemId-box',
        nodeId: '632db0502c80db1268b765d9',
        outputChannel: 'out',
        inputChannel: 'box',
      },
      {
        position: 1,
        nodeId: '632db03e2c80db1268b765d7',
        outputChannel: 'file',
        itemId: 'itemId-img',
        inputChannel: 'image',
      },
    ],
    items: [
      itemImg,
      itemBox,
    ],
  };

  const prepared = prepareBundle(bundle);

  expect(prepared.inputs.image).toBe(itemImg);
  expect(prepared.inputs.box).toBe(itemBox);

  console.log(prepared);
});
