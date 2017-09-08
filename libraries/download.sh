#!/bin/bash

local_folder=$1
remote_username=$2
remote_ip=$3
remote_folder=$4
remote_password=$5

echo "从本地目录下载转换语音xml文件到远程服务器目录...."
expect<<- END
set timeout -1
spawn scp -r $local_folder $remote_username@$remote_ip:$remote_folder
expect {
    "yes/no" { send "yes\r"; exp_continue}
    "password:" { send "$remote_password\r" }
}
expect eof
exit
END
echo ok
