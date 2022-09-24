
export {};

declare global 
{
  namespace jest 
  {
    interface Matchers<R> 
    {
      toMatchCustom(fnc: (v : any) => void): R;
    }
  }
}
