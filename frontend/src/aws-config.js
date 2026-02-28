// src/aws-config.js
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_YbKVWQnzr', // ✅ NO EXTRA CHARACTER
      userPoolClientId: '4rlraa0n1rh9dh5k5q4b55uk7e',
      loginWith: { email: true },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: { required: true },
        name: { required: true },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export default awsConfig;