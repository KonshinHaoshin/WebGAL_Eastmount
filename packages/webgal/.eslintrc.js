module.exports = {
  extends: ['alloy', 'alloy/react', 'alloy/typescript', 'plugin:prettier/recommended'],
  env: {
    // ä½ çš„çŽ¯å¢ƒå˜é‡ï¼ˆåŒ…å«å¤šä¸ªé¢„å®šä¹‰çš„å…¨å±€å˜é‡ï¼?
    //
    // browser: true,
    // node: true,
    // mocha: true,
    // jest: true,
    // jquery: true
  },
  globals: {
    // ä½ çš„å…¨å±€å˜é‡ï¼ˆè®¾ç½®ä¸º false è¡¨ç¤ºå®ƒä¸å…è®¸è¢«é‡æ–°èµ‹å€¼ï¼‰
    //
    // myGlobal: false
  },
  rules: {
    // è‡ªå®šä¹‰ä½ çš„è§„åˆ?
    // æœ€å¤§åœˆå¤æ‚åº?
    complexity: ['error', 30],
    'linebreak-style': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    semi: 2,
    // indent: ['error', 2],
    'semi-style': ['error', 'last'],
    'react/jsx-no-useless-fragment': [
      'error',
      {
        allowExpressions: true,
      },
    ],
  },
};
