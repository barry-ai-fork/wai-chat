export const onRequestGet: PagesFunction = async ({request,env}) => {
  console.log(env)
	return new Response(
		JSON.stringify({
			time: new Date().toISOString(),
      test1:env.TEST,
		}),
		{
			headers: {
				'content-type': 'application/json',
			},
		}
	);
};
