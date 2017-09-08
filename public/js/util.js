function initDateRangePicker(){
	//设定input默认时间
		$('input[name="daterange').val((moment().startOf('day')).format('YYYY-MM-DD HH:mm') + " 至 " + (moment().add(1, "d").startOf('day')).format('YYYY-MM-DD HH:mm'));

		//初始化daterangepicker
		$('input[name="daterange"]').daterangepicker({
		    "startDate": moment().startOf('day'),
		    "endDate": moment().add(1, "d").startOf('day'),
		    locale: {
		        applyLabel: '确定',
		        cancelLabel: '关闭',
		        customRangeLabel: "自定义日期",
		        daysOfWeek: ["日", "一", "二", "三", "四", "五", "六"],
		        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
		    },
		    "timePicker": true,
		    "timePicker24Hour": true
		}, function(start, end, label) {
		    $('input[name="daterange').val(start.format('YYYY-MM-DD HH:mm') + ' 至 ' + end.format('YYYY-MM-DD HH:mm'))
		});
}

//判断是否为mac系统
var isMac = function() {
    return /macintosh|mac os x/i.test(navigator.userAgent);
}

var isWindows = function() {
    return /windows|win32/i.test(navigator.userAgent);
}