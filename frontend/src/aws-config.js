// src/aws-config.js
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_YbKVWQnzr',
      userPoolClientId: '4rlraa0n1rh9dh5k5q4b55uk7e',
      region: 'ap-south-1',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      mfa: {
        status: 'off',
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
      userAttributes: {
        email: { required: true },
        name: { required: true },
      },
      allowUserPasswordAuth: true,
    },
  },
};

export default awsConfig;