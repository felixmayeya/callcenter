#!/bin/bash

remote_username=$1
remote_ip=$2
remote_folder=$3
local_folder=$4
remote_password=$5

echo "从远程服务器目录下载转换语音xml文件到本地服务器目录...."
expect<<- END
set timeout -1
spawn scp -r $remote_username@$remote_ip:$remote_folder $local_folder
expect {
    "yes/no" { send "yes\r"; exp_continue}
    "password:" { send "$remote_password\r" }
}
expect eof
exit
END
echo ok
