module.exports = function($) {

  //根据单个语音文件路径，解析相关节点内容，并以json格式返回;radio_path: 音频文件全路径
  $.get("/getPhrasesRecord/:radio_path", function*(next){

	var radio_file_path= this.params.radio_path;

	if(!radio_file_path || radio_file_path ==""){
		radio_file_path = "C:/home/xml_result/13639394640.xml";
	}
	var fs=require('fs');
	fs.readFile(radio_file_path,'utf-8',function(err,data){
		if(err){
			console.error(err);
		}
		else{

			var select = require('xpath.js')
			, dom = require('xmldom').DOMParser

			var doc = new dom().parseFromString(data);
			var node_record = select(doc, "//root//ok_list//record");
			var node_silence_list = select(doc, "//root//ok_list//silence_list");
			var node_silence_sentence = select(doc, "//root//ok_list//sentence");


		    var sentence_list = [];

		    for(var i=0; i < node_silence_sentence.length; i++){
				sentence_list.push({
					start_time: node_silence_sentence[i].getAttribute("start_time"),
					end_time: node_silence_sentence[i].getAttribute("end_time"),
					speed: node_silence_sentence[i].getAttribute("speed"),
					role: node_silence_sentence[i].getAttribute("role"),
					emotion_type: node_silence_sentence[i].getAttribute("emotion_type"),
					emotion_score: node_silence_sentence[i].getAttribute("emotion-score"),
					sentence_text: node_silence_sentence[i].getAttribute("text")
				})

			}

		    records = {
				 record : {
					record_path: node_record[0].getAttribute("record_key"),
					durtime:  node_record[0].getAttribute("durtime")
				},

				 silence_total_time : node_silence_list[0].getAttribute("total_time"),

				 sentence:sentence_list
			}

			console.log(records);

			/*
			var parseString = require('xml2js').parseString;
			var xml = '<?xml version="1.0" encoding="UTF-8" ?><business><company>Code Blog</company><owner>Nic Raboy</owner><employee><firstname>Nic</firstname><lastname>Raboy</lastname></employee><employee><firstname>Maria</firstname><lastname>Campos</lastname></employee></business>';
			parseString(xml, function (err, result) {
				console.dir(JSON.stringify(result));
			});
			*/


		}
	});

  });

}
//使用JS方法，根据单个语音文件路径，解析相关节点内容，并以json格式返回;radio_file_path: 音频文件全路径
function getXmlRecordsItem(radio_file_path){

var records_ss = "";
console.log("in-----"+radio_file_path);
	if(!radio_file_path || radio_file_path ==""){
		return "radio_file_path is not exists.";
	}

	var fs=require('fs');

	fs.readFile(radio_file_path,'utf-8',function(err,data){

		if(err){
			console.error(err);
			return err;
		}
		else{

			var select = require('xpath.js')
			, dom = require('xmldom').DOMParser

			var doc = new dom().parseFromString(data);
			var node_record = select(doc, "//root//ok_list//record");
			var node_silence_list = select(doc, "//root//ok_list//silence_list");
			var node_silence_sentence = select(doc, "//root//ok_list//sentence");


		    var sentence_list = [];

		    for(var i=0; i < node_silence_sentence.length; i++){
				sentence_list.push({
					start_time: node_silence_sentence[i].getAttribute("start_time"),
					end_time: node_silence_sentence[i].getAttribute("end_time"),
					speed: node_silence_sentence[i].getAttribute("speed"),
					role: node_silence_sentence[i].getAttribute("role"),
					emotion_type: node_silence_sentence[i].getAttribute("emotion_type"),
					emotion_score: node_silence_sentence[i].getAttribute("emotion-score"),
					sentence_text: node_silence_sentence[i].getAttribute("text")
				})

			}

		    records_ss = {
				 record : {
					record_path: node_record[0].getAttribute("record_key"),
					durtime:  node_record[0].getAttribute("durtime")
				},

				 silence_total_time : node_silence_list[0].getAttribute("total_time"),

				 sentence:sentence_list
			}


		}
	});


}

//使用JS方法，得到一整段录音string格式的返回结果(只有对话文本内容);radio_file_path: 音频文件全路径
exports.getXmlRecords =function getXmlRecords(radio_file_path){

	if(!radio_file_path || radio_file_path ==""){
		return "radio_file_path is not exists.";
	}
	var fs=require('fs');
	fs.readFile(radio_file_path,'utf-8',function(err,data){
		if(err){
			console.error(err);
			return err;
		}
		else{

			var select = require('xpath.js')
			, dom = require('xmldom').DOMParser

			var doc = new dom().parseFromString(data);

			var node_silence_sentence = select(doc, "//root//ok_list//sentence");


		    var sentence_records = "";

		    for(var i=0; i < node_silence_sentence.length; i++){
				sentence_records += node_silence_sentence[i].getAttribute("text")+" ";

			}
		    return sentence_records;
		}
	});

}
