module.exports = function (options) {
  options = typeof options === 'object' ? options : {};

  var _data   = {};
  var _scheme = {};

  var ruleRegex        = /^(.+?)\[(.+)\]$/,
     numericRegex      = /^[0-9]+$/,
     integerRegex      = /^\-?[0-9]+$/,
     decimalRegex      = /^\-?[0-9]*\.?[0-9]+$/,
     emailRegex        = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
     alphaRegex        = /^[a-z]+$/i,
     alphaNumericRegex = /^[a-z0-9]+$/i,
     alphaDashRegex    = /^[a-z0-9_\-]+$/i,
     naturalRegex      = /^[0-9]+$/i,
     naturalNoZeroRegex= /^[1-9][0-9]*$/i,
     ipRegex           = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
     base64Regex       = /[^a-zA-Z0-9\/\+=]/i,
     mobileRegex       = /^1[3|4|5|7|8][0-9]\d{8}$/,
     numericDashRegex  = /^[\d\-\s]+$/,
     urlRegex          = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
     dateRegex         = /\d{4}-\d{1,2}-\d{1,2}/;

  var _hooks = {
      required: function(value) {
          return (value !== undefined && value !== null && value !== '');
      },
      matches: function(value, matchName) {
          var el = this.form[matchName];

          if (el) {
              return value === el.value;
          }

          return false;
      },
      email: function(value) {
          return emailRegex.test(value);
      },
      min_length: function(value, length) {
          if (!numericRegex.test(length)) {
              return false;
          }

          return (value.length >= parseInt(length, 10));
      },
      max_length: function(value, length) {
          if (!numericRegex.test(length)) {
              return false;
          }

          return (value.length <= parseInt(length, 10));
      },
      exact_length: function(value, length) {
          if (!numericRegex.test(length)) {
              return false;
          }

          return (value.length === parseInt(length, 10));
      },
      greater_than: function(value, param) {
          if (!decimalRegex.test(value)) {
              return false;
          }

          return (parseFloat(value) > parseFloat(param));
      },
      less_than: function(value, param) {
          if (!decimalRegex.test(value)) {
              return false;
          }

          return (parseFloat(value) < parseFloat(param));
      },
      alpha: function(value) {
          return (alphaRegex.test(value));
      },
      alpha_numeric: function(value) {
          return (alphaNumericRegex.test(value));
      },
      alpha_dash: function(value) {
          return (alphaDashRegex.test(value));
      },
      numeric: function(value) {
          return (numericRegex.test(value));
      },
      integer: function(value) {
          return (integerRegex.test(value));
      },
      decimal: function(value) {
          return (decimalRegex.test(value));
      },
      natural: function(value) {
          return (naturalRegex.test(value));
      },
      natural_no_zero: function(value) {
          return (naturalNoZeroRegex.test(value));
      },
      ip: function(value) {
          return (ipRegex.test(value));
      },
      mobile: function(value) {
          return (mobileRegex.test(value));
      },
      base64: function(value) {
          return (base64Regex.test(value));
      },
      url: function(value) {
          return (urlRegex.test(value));
      },
      credit_card: function(value){
          if (!numericDashRegex.test(value)) return false;

          var nCheck = 0, nDigit = 0, bEven = false;
          var strippedField = field.value.replace(/\D/g, "");

          for (var n = strippedField.length - 1; n >= 0; n--) {
              var cDigit = strippedField.charAt(n);
              nDigit = parseInt(cDigit, 10);
              if (bEven) {
                  if ((nDigit *= 2) > 9) nDigit -= 9;
              }

              nCheck += nDigit;
              bEven = !bEven;
          }

          return (nCheck % 10) === 0;
      }
  };

  function _validate(){
    var result = [];
    for(var field in _scheme){

        var field_rules = {};
        var rules = _scheme[field].split(";")
        for(var rule in rules){
          var parameters = [];
          parameters.push(_data[field]);
          field_rules[rules[rule]] = parameters;
        }

        for(var rule in field_rules){
            if(!_hooks[rule].apply(this, field_rules[rule])){
                result.push({field:field, message:rule});
            }
        }
    }
    return result;
  }

  return function * (next) {

    this.validate = function(data, scheme){
        _data = data;
        _scheme = scheme;
        return _validate();
    };

    return yield * next;
  }
}
