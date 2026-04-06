const { handler } = require('../lambda/deployHandler');

exports.deploy = async (req, res, next) => {
  try {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      isBase64Encoded: false,
    };

    const lambdaResponse = await handler(event);
    const responseBody = JSON.parse(lambdaResponse.body || '{}');

    res.status(lambdaResponse.statusCode || 200).json(responseBody);
  } catch (err) {
    next(err);
  }
};
