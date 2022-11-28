class FetchMock {
  static fn = jest.fn(async () => {
    const response = new Response();
    return response;
  });

  static async jsonResponse(json: string): Promise<Response> {
    const response = new Response(json);
    return response;
  }
}

export { FetchMock };
