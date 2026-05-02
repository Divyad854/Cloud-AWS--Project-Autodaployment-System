// src/aws-config.js

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: "ap-south-1_YbKVWQnzr",
      userPoolClientId: "4rlraa0n1rh9dh5k5q4b55uk7e",
      loginWith: {
        email: true,
      },
    },
  },
};

export default awsConfig;