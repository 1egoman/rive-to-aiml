// import _ from 'lodash';
function trigger(match) {
  return { type: "TRIGGER_START" };
};
function response(match) {
  return { type: "RESPONSE_START" };
};
function comment(match) {
  return { type: "COMMENT" };
};
function word(match) {
  return { type: "WORD", word: match };
};
let tokens = [];

// triggers
tokens.push({match: /\n\+ /, is: trigger});
tokens.push({match: /^\+ /, is: trigger});

// responses
tokens.push({match: /\n- /, is: response});
tokens.push({match: /^- /, is: response});

// comments
tokens.push({match: /\n\/\//, is: comment});
tokens.push({match: /^\/\//, is: comment});

// a word
tokens.push({match: /[a-zA-Z]+/, is: word});

function tokenize(string) {
  let tokenList = [], returnedTokens = true;
  while (true) {
    let matchingToken = tokens.reduce((acc, token) => {
      let match = token.match.exec(string);
      if (match && (match.index < acc.match.index)) {
        return {match, out: token.is(match)};
      } else {
        return acc;
      }
    }, {match: {index: Infinity}});

    if (matchingToken.match.index !== Infinity) {
      // remove the token for the next round
      string = string.slice(0, matchingToken.match.index) + string.slice(matchingToken.match.index + matchingToken.match[0].length);
      console.log(string, matchingToken)
      tokenList.push(matchingToken.out);
    } else {
      break;
    }
  }

  return tokenList;
}
console.log(tokenize(`
+ Hello
// comment
- World
- World
`));

export default class lodashDecorators {
  constructor() {
    this.msg = 'hey!';
  }

  mainFn() {
    return this.msg;
  }
}
