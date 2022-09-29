
import PipelineApi from '../../src/main';


/** */
export default class TestApi
  extends PipelineApi
{
  /**
   * 
   */
  constructor()
  {
    super({ apiKey: 'key-for-testing-' });

    (this.client as any).client.request = jest.fn();
  }

  /**
   * @param method method
   * @returns jest mock
   */
  mock() : jest.Mock
  {
    return (this.client as any).client.request;
  }
}
