
expect.extend(
  {
    toMatchCustom: (value, fnc : (v : any) => void) =>
    {
      fnc(value);

      return {
        pass: true,
        message: () => `Expected ${value} to match custom function.`,
      };
    },
  },
);

