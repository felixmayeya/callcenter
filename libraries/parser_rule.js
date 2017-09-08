/**
*@desc 规则解析方法，解析规则内容生成对应的正则表达式(目前支持简单的逻辑运算符 ”&&”、“||”、“!” 等组合的规则)
*@param parserContent json格式的规则内容
*@author fanxd
*/
function parserRule(parserContent){
//  var parser_content =JSON.parse(rule.parser_content);
   var parser_content =JSON.parse(parserContent);
  // console.log(parser_content);
  if(parser_content.expression.binary){
    var binary = parser_content.expression.binary;
    // console.log(binary);
    // console.log(binary.operator);
    if(binary.operator==='and' || binary.operator==='&&'){

      if(binary.left.unary && binary.right.unary){
        if(binary.left.unary.operator==='!' && binary.right.unary.operator==='!'){
          pattern = new RegExp("(?!.*"+binary.left.unary.expression.comparison.key+"|.*"+binary.right.unary.expression.comparison.key+")^.*$");
        }
      }else if(!binary.left.unary && binary.right.unary){
        if(binary.right.unary.operator==='!'){
          pattern = new RegExp("(?=.*"+binary.left.comparison.key+")(?!.*"+binary.right.unary.expression.comparison.key+")");
        }
      }else if(binary.left.unary && !binary.right.unary){
        if(binary.left.unary.operator==='!'){
          pattern = new RegExp("(?!.*"+binary.left.unary.expression.comparison.key+")(?=.*"+binary.right.comparison.key+")");
        }
      }else{
        pattern = new RegExp("(?=.*"+binary.left.comparison.key+")(?=.*"+binary.right.comparison.key+")");
      }
      // console.log(pattern);
    }else if(binary.operator==='or' || binary.operator==='||'){

      if(binary.left.unary && binary.right.unary){
        if(binary.left.unary.operator==='!' && binary.right.unary.operator==='!'){
          pattern = new RegExp("(?!.*"+binary.left.unary.expression.comparison.key+"|.*"+binary.right.unary.expression.comparison.key+")^.*$");
        }
      }else if(!binary.left.unary && binary.right.unary){
        if(binary.right.unary.operator==='!'){
          pattern = new RegExp("(?=.*"+binary.left.comparison.key+")^.*|(?!.*"+binary.right.unary.expression.comparison.key+")^.*$");
        }
      }else if(binary.left.unary && !binary.right.unary){
        if(binary.left.unary.operator==='!'){
          pattern = new RegExp("(?!.*"+binary.left.unary.expression.comparison.key+")^.*|(?=.*"+binary.right.comparison.key+")^.*$");
        }
      }else{
        pattern = new RegExp(""+binary.left.comparison.key+"|"+binary.right.comparison.key+"");
      }
      // console.log(pattern);
    }
  }else if(parser_content.expression.unary){
    var unary = parser_content.expression.unary;
    if(unary.operator==='!'){
      pattern = new RegExp("(?!.*"+unary.expression.comparison.key+")^.*$");
    }
    // console.log(pattern);
  }else if(parser_content.expression.comparison){
    var comparison = parser_content.expression.comparison;
    pattern = new RegExp(""+comparison.key+"");
    // console.log(pattern);
  }
  return pattern;
}

module.exports = parserRule;
