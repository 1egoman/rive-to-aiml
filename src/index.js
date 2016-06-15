// import _ from 'lodash';

let tokens = [];
function trigger(match) { return { type: "TRIGGER_START" }; };
function response(match) { return { type: "RESPONSE_START" }; };
function comment(match) { return { type: "COMMENT", data: match[1].trim() }; };
function word(match) { return { type: "WORD", data: match[0] }; };
function symbol(match) { return { type: "SYMBOL", data: match[0] }; };
function star(matchType, match) { return { type: "TRIGGER_WILDCARD", match: matchType}; };
function starMatch(match) {
  if (match[1]) {
    return { type: "RESPONSE_WILDCARD_MATCH", number: parseInt(match[1]) };
  } else {
    return { type: "RESPONSE_WINDCARD_MATCH", number: 1 };
  }
};
function responseWeight(match) { return { type: "RESPONSE_WEIGHT", number: parseInt(match[1]) }; };
function responseContinue(match) { return { type: "RESPONSE_CONTINUE" }; };
function triggerAlternativeStart(match) { return { type: "TRIGGER_ALTERNATIVE_START" }; };
function triggerAlternativeEnd(match) { return { type: "TRIGGER_ALTERNATIVE_END" }; };
function triggerOptionalStart(match) { return { type: "TRIGGER_OPTIONAL_START" }; };
function triggerOptionalEnd(match) { return { type: "TRIGGER_OPTIONAL_END" }; };

// triggers
tokens.push({match: /^\+ /m, is: trigger});
// wildcards
tokens.push({match: / ?\* ?/, is: star.bind(this, "all")});
tokens.push({match: / ?_ ?/, is: star.bind(this, "word")});
tokens.push({match: / ?# ?/, is: star.bind(this, "number")});
// alternatives
tokens.push({match: /\(/, is: triggerAlternativeStart});
tokens.push({match: /\)/, is: triggerAlternativeEnd});
// optionals
tokens.push({match: /\[/, is: triggerOptionalStart});
tokens.push({match: /\]/, is: triggerOptionalEnd});

// responses
tokens.push({match: /^- /m, is: response});
// continuation
tokens.push({match: /\n\^ /, is: responseContinue});
// response weight
tokens.push({match: /{weight=([0-9]+)}/, is: responseWeight});
// response wildcard resolution
tokens.push({match: /(?:<star>|<star([0-9]+)>)/, is: starMatch});

// comments
tokens.push({match: /^\/\/(.*)$/m, is: comment});

// a word
tokens.push({match: /[a-zA-Z]+/, is: word});
tokens.push({match: /./, is: symbol});

function tokenize(string) {
  console.log(string);
  console.log("===");
  let tokenList = [];
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
      tokenList.push(matchingToken.out);
    } else {
      break;
    }
  }

  return tokenList;
}
console.log(tokenize(`
// comment
+ My name is (ryan|john[ny])
- Hi, <star>!
`));
