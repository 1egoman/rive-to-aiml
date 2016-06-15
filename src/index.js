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
function carriageReturn(match) { return { type: "CARRIAGE_RETURN" }; };

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
tokens.push({match: /^\^ /m, is: responseContinue});
// response weight
tokens.push({match: /{weight=([0-9]+)}/, is: responseWeight});
// response wildcard resolution
tokens.push({match: /(?:<star>|<star([0-9]+)>)/, is: starMatch});

// comments
tokens.push({match: /^\/\/(.*)$/m, is: comment});

// a word
tokens.push({match: /[a-zA-Z]+/, is: word});
tokens.push({match: /\r?\n/, is: carriageReturn});
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



let ends = {
  "TRIGGER_START": "CARRIAGE_RETURN",
  "RESPONSE_START": "CARRIAGE_RETURN",
  "TRIGGER_ALTERNATIVE_START": "TRIGGER_ALTERNATIVE_END",
  "TRIGGER_OPTIONAL_START": "TRIGGER_OPTIONAL_END",
}
function validate(allTokens) {
  let root = [];

  for (let ct = 0; ct < allTokens.length; ct++) {
    let token = allTokens[ct];
    switch (token.type) {
      // tokens that have a start and an end
      // initially, begin on the start. Find the end tag, and put everything in
      // between as children. Rinse and repeat recursively.
      case "TRIGGER_START":
      case "RESPONSE_START":
      case "TRIGGER_ALTERNATIVE_START":
      case "TRIGGER_OPTIONAL_START":
        let triggerContents = getUntilToken(allTokens.slice(ct), ends[token.type]);
        if (triggerContents) {
          let trigger = Object.assign({}, token, {
            contents: validate(triggerContents.slice(1)),
          });
          root.push(trigger);
          ct += triggerContents.length; // move on to tokens that haven't become children
        } else {
          throw new Error("Triggers must be followed by a carriage return");
        }
        break;

      // carriage returns are meaningless at this point
      case "CARRIAGE_RETURN":
        break;

      // tokens that stand by themselves
      default:
        root.push(token);
        break;
    }
  }
  return root;
}

function getUntilToken(tokenList, tokenType='SYMBOL') {
  let selectedToken = tokenList[0], tokenIndex = 0;
  while (selectedToken.type !== tokenType) {
    if (tokenList.length > tokenIndex) {
      selectedToken = tokenList[++tokenIndex];
    } else {
      return false; // no such token upstream
    }
  }
  return tokenList.slice(0, tokenIndex);
}


// let allTokens = tokenize(`
// // comment
// + My name is (ryan|john[ny])
// - Hi, <star>!
//
// `);
let allTokens = tokenize(`
+ abc def ghi
`);

let validated = validate(allTokens);
console.log(JSON.stringify(validated, null, 2));
