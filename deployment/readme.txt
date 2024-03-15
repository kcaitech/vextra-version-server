前端发布流程（windows系统）

1、先提条件

（1）在C:\Windows\System32\drivers\etc\hosts文件中添加：
121.199.25.192 registry.protodesign.cn
127.0.0.1 k8s-test.protodesign.cn

修改hosts文件前需先在文件属性-安全中将Users用户的权限修改为完全控制

（2）安装powershell、ssh

（3）安装wsl2

（4）安装docker desktop

（5）docker desktop中添加以下配置
{
    "insecure-registries": [
        "registry.protodesign.cn:36000"
    ]
}

2、在cmd命令行进入ssh-port-forward-internal目录，执行start.bat脚本
第一次执行需要键入yes并输入密码：
kcserver

3、git拉取本工程master分支的最新代码

4、修改package.json中@kcdesign/data包的版本号，例如：`0.2.87`
在以下页面中可查看包的最新版本号：
https://packages.aliyun.com/npm/npm-registry/artifacts

5、刷新、打开k8s管理页面：http://k8s-test.protodesign.cn:30001/kubernetes/kcserver/namespace/kc/workload/view/Deployment/doc-versioning-service
右下方查看app容器当前镜像的版本号，例如：`test-0.0.1-23`
账号密码：
admin
kcai1212

6、在cmd命令行进入工程的deployment\app目录，执行build.bat脚本

build.bat version-tag
例如：build.bat test-0.0.1-24，注意版本号不能与历史版本号混淆

执行完毕后注意仔细查看打包时输出的信息，确认：
（1）npm编译成功
（2）docker镜像编译成功
（3）docker镜像上传成功

在以下页面中可确认镜像是否上传成功：
http://registry.protodesign.cn:36000/harbor/projects/2/repositories/doc-versioning-service/artifacts-tab
账号密码：
kcserver
MEu2o91KHihnuLID6buRGrjRVo9YuM48

7、在k8s管理页面的上方点击“调整镜像版本”按钮，输入新的版本号，例如：`test-0.0.1-24`，点击“确定”
等待页面刷新，查看左侧“历史版本”栏目，确认新版本已发布，并等待新版本的容器状态变为“Ready”（变成绿色即可）

8、在k8s管理页面左侧的“历史版本”栏目中可对历史版本进行回滚操作，点击“回滚到”按钮并确认即可。
若历史版本中不存在“回滚到”按钮，可点击上方的刷新按钮后再试
