(function(exports) {

	function Expecting(type, lastToken) {
		this.type = type;
		this.lastToken = lastToken;

		this.lastTokenValue = lastToken ? lastToken.value || '' : '';
		this.lastTokenType = lastToken ? lastToken.type || '' : '';
		this.name = 'Expecting';
		this.message = 'Expecting ' + type + ', last Token: ' + this.lastTokenValue + ' (' + this.lastTokenType + ')';
	}
	Expecting.prototype = new Error();
	Expecting.prototype.constructor = Error;

	function Token(type, value) {
		this.type = type;
		this.value = value.trim();
		this.isKey = function() {
			return this.type == 'key';
		}
		this.isValue = function() {
			return this.type == 'value';
		}
		this.isComparator = function() {
			return this.type == 'comparator';
		}
		this.isOperator = function() {
			return this.type == 'operator';
		}
		this.isNot = function() {
			return (this.type == 'operator' && this.value == '!');
		}
		this.isAnd = function() {
			return (this.type == 'operator' && (this.value == 'and' || this.value == '&&'))
		}
		this.isOr = function() {
			return (this.type == 'operator' && (this.value == 'or' || this.value == '||'))
		}
		this.isEnd = function() {
			return this.type == 'END'
		}
	}

	function Tokenizer(expression) {
		// distinction between key and value are nor helpfull... both are "strings"
		var tokenDef = {
			//'key': /^ *([a-zA-Z0-9-]+，?) *(=|>=|<=|>|<|!=)/,
			//'key': /^ *([a-zA-Z0-9-]{1,}) */,
			//'key': /^([\u4e00-\u9fa5_a-zA-Z0-9]+，?)+$/,

			'comparator': /^ *(=|>=|<=|>|<|!=|like) */, // in['a','b'] -> $in:['a','b'];  >= ; <=
			'operator': /^(and) ?|^(or) ?|^(&&) ?|^(\|\|) ?|^(\() ?|^(\)) ?|^(!) ?/, //|^(!) ?
			'string': /^ *(([\u4e00-\u9fa5a-zA-Z0-9-_\.\*%:\\\/\.]{1,})|([\'\"][\u4e00-\u9fa5a-zA-Z0-9-_\.\*%:\(\)\\\/\. ]{1,}[\'\"])) */
		};
		this.tokens = [];
		this.originalExpression = expression;

		this.peek = function() {
			var token = null;
			expression = expression.trim();
			for (tokenType in tokenDef) {
				var type = tokenType;
				var re = tokenDef[tokenType];
				var match = expression.match(re);


				if (match) {
					if (tokenType == 'string') {
						if (this.tokens.length > 0 && this.tokens[this.tokens.length - 1].type == 'comparator') {
							type = 'value';
						} else {
							type = 'key';
						}
					}
					token = new Token(type, ((match[1] || match[0]).trim()));
					break;
				}
			}
			if (!token) {
				return new Token('END', '')
			} else {
				return token;
			}
		}

		this.next = function() {
			var token = this.peek();
			this.tokens.push(token);
			expression = expression.replace(token.value, '');
			return token;
		}

		this.tokenize = function() {
			while (expression.length > 0) {
				this.next();
			}
		}

		this.last = function() {
			return this.tokens[this.tokens.length - 1].type == 'END' ? this.tokens[this.tokens.length - 2] : this.tokens[this.tokens.length - 1];
		}
	}

	function Parser(expression) {
		this.expression = expression;
		var that = this;
		that.tokenizer = (expression) ? new Tokenizer(expression) : new Tokenizer('');

		// if (expression) that.tokenizer = new Tokenizer(expression);
		// Condition ::= Key '=' Value |
		// 		  		 Key '>' Value |
		//		 		 Key '<' Value |
		//				 Key

		function parseCondition() {
			var keyToken = that.tokenizer.next();
			if (!keyToken.isKey() && !keyToken.isValue()) throw new Expecting('KEY', that.tokenizer.last());
			var compToken = that.tokenizer.peek();
			if (compToken && compToken.isComparator()){
				compToken = that.tokenizer.next();
			}else{
				return {
					comparator: 'exists',
					key: keyToken.value,
				}
			}
			if (!compToken || !compToken.isComparator()) throw new Expecting('COMPARATOR', that.tokenizer.last());
			var valueToken = that.tokenizer.next();
			if (!valueToken.isValue()) throw new Expecting('VALUE', that.tokenizer.last());

			return {
				comparator: compToken.value,
				key: keyToken.value,
				value: valueToken.value,
			}

		}

		// Primary ::= Condition |
		//			   '('OrExpression')'

		function parsePrimary() {
			var exp;
			var token = that.tokenizer.peek();
			if (token.isKey() || token.isValue()) {
				var condition = parseCondition();
				return {
					comparison: condition
				}
			}
			if (token.isOperator() && token.value == '(') {
				that.tokenizer.next();
				var exp = parseExpression();
				token = that.tokenizer.next();
				if (token.isOperator() && token.value == ')') {
					return {
						expression: exp
					}
				} else {
					throw new Expecting(')');
				}
			}
		}

		// Unary ::= Primary |
		//		 	 '!'Unary

		function parseUnary() {
			var exp;
			var token = that.tokenizer.peek();
			if (token.isNot()) {
				token = that.tokenizer.next();
				exp = parseUnary();

				return {
					unary: {
						operator: token.value,
						expression: exp
					}
				}
			}
			return parsePrimary();
		}

		// AndExpression ::= Unary |
		//					 AndExpression 'and' unary|

		function parseAndExp() {
			var token, left, right;
			left = parseUnary();
			token = that.tokenizer.peek();
			if (token.isAnd()) {
				token = that.tokenizer.next();
				right = parseAndExp();
				if (!right) throw new Expecting('EXPRESSION', token);

				return {
					binary: {
						operator: token.value,
						left: left,
						right: right
					}
				}
			} else if (!token.isEnd() && !token.isOperator()) {
				throw new Expecting('OPERATOR', token);
			}
			return left;
		}

		// OrExpression ::= AndExpression |
		// 				    OrExpression 'or' AndExpression

		function parseOrExp() {
			var token, left, right;
			left = parseAndExp();
			token = that.tokenizer.peek();
			if (token.isOr()) {
				token = that.tokenizer.next();
				right = parseExpression();

				return {
					binary: {
						operator: token.value,
						left: left,
						right: right
					}
				}
			}

			return left;
		}

		// Expression ::= OrExpression

		function parseExpression() {
			var exp = parseOrExp();
			if (!exp) throw new Expecting('EXPRESSION', that.tokenizer.last());
			return exp
		}

		this.parse = function(expression) {
			if (expression) {
				that.tokenizer = new Tokenizer(expression);
			} else if (!(this.expression)) {
				throw new Error('No expression to parse...');
			}
			var exp = parseExpression();
			return {
				expression: exp
			}
		}
	}

	exports.Token = Token;
	exports.Tokenizer = Tokenizer;
	exports.Parser = Parser;

})(typeof exports === 'undefined' ? this['logicParser'] = {} : exports)
