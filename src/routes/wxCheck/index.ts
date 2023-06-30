import { Router } from "express";
import sha1 from "sha1";
import { getJsData, getObjData, getXMLStr } from "../../utils/tools";
import axios from "axios";
import { IWXError, IWXQrCodeCreateTemp, IWXQrCodeRes, IWXTicketRes } from "./types";
import { getImageFromUrl } from "../../utils/files";
import configs from "../../config/app.json";
import * as fs from "fs";
import * as https from 'https';
import FormData from "form-data";
import { wxResMusic } from "./wxRes";

const wxCheckRouters = Router();
// 那些关注的人
let subscribe_arr: string[] = [];
const serverUrl = configs.serverUrl;
const DEV = configs.isDev;
const TOKEN = DEV ? "测试号TOKEN" : configs.wxConfig.token;
const APPID = DEV ? "测试号APPID" : configs.wxConfig.appId;
const APPSECRET = DEV ? "测试号APPSECRET" : configs.wxConfig.appSecret;
// 获取access_token
const getAToken = () => {
    return new Promise<{
        data: string,
        error: boolean
    }>((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
        axios.get(url).then(({ data }) => {
            if (data.access_token) {
                resolve({
                    error: false,
                    data: data.access_token
                })
            } else {
                resolve({
                    error: true,
                    data: ""
                })
            }
        })
    })
}
// 获取ticket
const getNewTicket = (access_token: string) => {
    console.log('access_token', access_token);
    return new Promise<IWXTicketRes | IWXError>((resolve, _reject) => {
        const ticket_url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${access_token}&type=jsapi`;
        axios.get(ticket_url).then(({ data }) => {
            resolve(data)
        })
    })
}
// 验证字符串
const getValidateStr = (timestamp: any, nonce: any) => sha1([TOKEN, timestamp, nonce].sort().join(""));
const postThumbApi = "https://api.weixin.qq.com/cgi-bin/media/upload?type=thumb" + (configs.wxServer ? "" : "&access_token=");
// 有效期
var enableTimestamp = 0;

// 过渡时间 提早5分钟，重新获取token 
var transitionTime = 5 * 60 * 1000;

// 1.获取token 令牌 通过postman获取即可
// get  
// let url =`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&
// appid=wx3680aee5b396cc0f&secret=13d16b772027b3d257b8e1ba28df9652`
// URL需要正确响应微信发送的Token验证 http://www.xcaipu.cn/weixin
// JS接口安全域名 www.xcaipu.cn/wx_js
// access_token: 令牌（有效期7200秒，开发者必须在自己的服务全局缓存access_token）
var ACCESS_TOKEN_DATA = {
    "access_token": "",
    "expires_in": 7200
};
// 2.获取ticket：门票 通过postman获取即可 与视频不同
// ticket：门票（有效期7200秒，开发者必须在自己的服务全局缓存jsapi_ticket）
// https://api.weixin.qq.com/cgi-bin/ticket/getticket?
// access_token=51_wy_LaL72FJc9HI1cnlRnm6kYtpjVho7tzZl4IDhBzLWsxSsRBB3tQ79KGp1f9kuoBO6JY33Ay3F4wjI94LLoVWQNsyrmLeuvuN2IkIHGxpusIfbOxcCkHwOiA5bRJubyBJj3f8KVpunx0Rl4ZUMgAJAKFX&type=jsapi
var TICKET_DATA: IWXTicketRes = {
    "errcode": 0,
    "errmsg": "ok",
    "ticket": "",
    "expires_in": 7200
}

async function InitData() {
    // 现在
    const nowTimeStamp = Date.now();

    // 1.判断当前的有效期，是否有效
    if ((enableTimestamp - transitionTime) < nowTimeStamp) {
        console.log('---过期了：重新请求---');
        // 如果是在过渡时间内了，要重新请求
        let rel = await getAToken()

        // 根据获取到的token，继续获取ticket
        if (rel.error) {
            console.log('token获取失败:', rel);
            return rel
        }
        ACCESS_TOKEN_DATA.access_token = rel.data;
        const ticketRes = await getNewTicket(rel.data);
        if (!("ticket" in ticketRes)) {
            return ticketRes
        }

        TICKET_DATA = ticketRes;
        enableTimestamp += nowTimeStamp + TICKET_DATA.expires_in * 1000;
        console.log('TICKET_DATA:', TICKET_DATA);
    } else {
        console.log('---未过期: 使用旧的access_token---');
    }

    const obj2 = {
        noncestr: (Math.random() + '').split('.')[1],
        jsapi_ticket: TICKET_DATA.ticket,
        timestamp: nowTimeStamp,
        url: `${serverUrl}/`
    }

    let js_arr = [
        `jsapi_ticket=${obj2.jsapi_ticket}`,
        `noncestr=${obj2.noncestr}`,
        `timestamp=${obj2.timestamp}`,
        `url=${obj2.url}`
    ];

    let js_str = js_arr.sort().join('&')
    console.log('js_str', js_str);

    let signature = sha1(js_str);
    console.log('signature', signature);
    const config_obj = {
        appId: APPID, // 必填，公众号的唯一标识
        timestamp: nowTimeStamp, // 必填，生成签名的时间戳
        nonceStr: obj2.noncestr, // 必填，生成签名的随机串
        signature,// 必填，签名
    }
    return config_obj
}

if (!configs.wxServer) {
    InitData();
}

// 记录关注结果
wxCheckRouters.post('/isSubscribe', async (req, res) => {
    console.log('isSubscribe:', req.body);
    let { ticket, myId } = req.body;

    // 方法1：ticket可以验证
    let index = subscribe_arr.findIndex(item => item == ticket);

    // 方法2：myId也可以验证
    index = subscribe_arr.findIndex(item => {
        if (item === myId) {
            return true;
        } else if (String(item).includes('_') && String(item).split('_')[1] === myId) {
            // 第一次关注会返回这个 EventKey: 'qrscene_0'
            return true;
        }
    });
    console.log('index', index);

    let hasOne = true;
    if (index == -1) {
        hasOne = false;
    } else {
        console.log('验证通过，登录成功------------------');
    }
    res.send({
        status: 0,
        data: hasOne
    })
})

wxCheckRouters.get("/wxInit", async (req, res) => {
    res.send(await InitData())
})


wxCheckRouters.get("/wxCheck", async (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;
    console.log("weichat", req.query);

    if (!signature || !timestamp || !nonce || !echostr) {
        res.send("请求参数不正确");
    } else {
        console.log(getValidateStr(timestamp, nonce));

        getValidateStr(timestamp, nonce) == signature
            ? res.header("content-type: text").send(echostr)
            : res.header("content-type: text").send("你不是微信");
    }
});

function downLoad(url: string, name: string, path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
    const saveFilePath = `${path}/${name}`;
    if (!fs.existsSync(saveFilePath)) {
        return new Promise<boolean>((resolve, reject) => {
            const file = fs.createWriteStream(saveFilePath);
            https
                .get(url, (response) => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(true);
                    });
                })
                .on('error', (error) => {
                    fs.unlinkSync(saveFilePath);
                    reject(error);
                });
        });
    }
    return Promise.resolve(false);
}
function concatenateSingers(singer: string): string {
    const singersArray: string[] = singer.split("&");
    const concatenatedSingers: string = singersArray.join(" and ");
    return concatenatedSingers;
}
wxCheckRouters.post("/wxCheck", async (req, res) => {
    console.log('post-wxCheck-query:', req.query);
    console.log("post-wxCheck-body:", req.body)
    const request = req.body;

    // 微信云部署消息推送的验证接口
    if (request.action == "CheckContainerPath") {
        return res.send('success');
    }
    // 微信云部署后台可以选择传参为json格式，接收和返回均为json，比较方便。
    if (request.MsgType) {
        console.log("消息类型:", request.MsgType);
        // 微信云部署端接收用户消息
        // 回复信息给 微信服务器
        let content = ''
        if (request.MsgType == 'text') {
            const searchUrl = `http://localhost:${configs.port}/search?format&kw=${encodeURIComponent(request.Content)}`;
            const arr = (await axios.get(searchUrl)).data as any[];
            const arrLength = arr.length;
            let cut = arrLength < 10 ? arrLength : 10;
            let name = []
            let artlist = []
            let mp3 = []
            const PREV = (request.Content as string).split(" ")[0];
            const RID = (request.Content as string).split(" ")[1];
            if (PREV == "play") {
                if (RID != "") {
                    const musicInfo = (await axios.get(`http://localhost:${configs.port}/search?rid=${RID}`)).data as any;
                    const mp3Link = musicInfo.mp3Url;
                    const singer = musicInfo.artist;
                    const title = musicInfo.name;
                    const pic120 = musicInfo.pic120;
                    const album = musicInfo.album;
                    const thumb = singer + "-" + album + "-" + title + "." + pic120.split(".").pop();
                    const fileFullPath = "./thumb/" + thumb;
                    let thumb_media_id = "";
                    if (title) {
                        console.log(await downLoad(pic120, thumb, "./thumb"));
                        if (fs.existsSync(fileFullPath)) {
                            const formData = new FormData();
                            formData.append('media', fs.createReadStream(fileFullPath));
                            axios.post(postThumbApi, formData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            }).then(({ data }) => {
                                console.log(data);
                                if (!(data.errcode)) {
                                    thumb_media_id = data.thumb_media_id;
                                    const result = wxResMusic(request.FromUserName, request.ToUserName, title, concatenateSingers(singer), mp3Link, mp3Link, thumb_media_id, true);
                                    return res.send(result)
                                }
                            })
                        }
                    }

                }
            } else {
                for (let i = 0; i < cut; i++) {
                    name[i] = arr[i].name;
                    artlist[i] = arr[i].artist;
                    const url = arr[i].mp3Url;
                    const rid = arr[i].rid;
                    mp3[i] = `<a href="weixin://bizmsgmenu?msgmenucontent=play ${rid}&msgmenuid=${request.MsgId}">[${i + 1}] ${name[i]}</a> - `;
                    content = content + mp3[i] + artlist[i] + "\n";
                }
            }
        }
        else if (request.MsgType == 'event') {
            content = 'event事件'
            if (request.Event == 'SCAN') {
                content = '好家伙，手机扫码' + request.EventKey
            } else if (request.Event == 'subscribe') {
                content = '好家伙，欢迎您的关注！' + request.EventKey
            }
            if (request.Event == 'unsubscribe') {
                content = '好家伙，你居然敢取笑关注？' + request.EventKey
            }
        }
        else {
            content = '其他信息来源！' + JSON.stringify(request)
        }

        return res.send({
            "ToUserName": request.FromUserName,
            "FromUserName": request.ToUserName,
            "CreateTime": Date.now(), // 整型，例如：1648014186
            "MsgType": "text",
            "Content": content
        })
    }
    let { signature, echostr, timestamp, nonce } = req.query;
    let relStr = getValidateStr(timestamp, nonce)
    if (relStr == signature) {
        console.log('---信息来自微信服务器---');
        // 提取信息
        let xmlData = await getXMLStr(req);
        console.log('xmlData:', xmlData);
        /** 微信服务器返回了的xml格式数据
        <xml>
          <ToUserName><![CDATA[gh_b3958963bb18]]></ToUserName>
          <FromUserName><![CDATA[od4SM6Y8InFQGTfBjsiMRhkteIAE]]></FromUserName>
          <CreateTime>1648658404</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[3]]></Content>
          <MsgId>23603117248352202</MsgId>
        </xml>
         */

        // 通过工具解析xml数据
        let jsData = await getJsData(xmlData)

        // 再次优化数据
        let msgObj = getObjData(jsData.xml)
        console.log('msgObj:', msgObj);
        subscribe_arr.push(msgObj.Ticket)
        subscribe_arr.push(msgObj.EventKey)
        // 如果长度超过100，登录人数过多时
        if (subscribe_arr.length > 100) {
            let start = subscribe_arr.length - 100;
            subscribe_arr = subscribe_arr.slice(start)
        }
        // 回复信息给 微信服务器
        let content = ''
        if (msgObj.MsgType == 'text') {
            if (msgObj.Content == "1") {
                content = '努力吧！'
            } else if (msgObj.Content == "2") {
                content = '再坚持一会，就成功了'
            } else if (msgObj.Content.includes('爱')) {
                content = '爱你一万年！'
            } else {
                content = '谢谢！'
            }
        }
        else if (msgObj.MsgType == 'event') {
            content = 'event事件'
            if (msgObj.Event == 'SCAN') {
                content = '好家伙，手机扫码' + msgObj.EventKey
            } else if (msgObj.Event == 'subscribe') {
                content = '好家伙，欢迎您的关注！' + msgObj.EventKey
            }
            if (msgObj.Event == 'unsubscribe') {
                content = '好家伙，你居然敢取笑关注？' + msgObj.EventKey
            }
        }
        else {
            content = '其他信息来源！' + JSON.stringify(msgObj)
        }


        // 根据来时的信息格式，重组返回。(注意中间不能有空格)
        let msgStr = `<xml>
          <ToUserName><![CDATA[${msgObj.FromUserName}]]></ToUserName>
          <FromUserName><![CDATA[${msgObj.ToUserName}]]></FromUserName>
          <CreateTime>${Date.now()}</CreateTime>
          <MsgType><![CDATA[text]]></MsgType>
          <Content><![CDATA[${content}]]></Content>
        </xml>`
        return res.send(msgStr)
        // 非常感谢尚硅谷的视频
        // 微信公众号开发接收信息 https://m.bilibili.com/video/BV1XJ411P7T4?p=10&share_medium=iphone&share_plat=ios&share_source=WEIXIN&share_tag=s_i&timestamp=1648654864&unique_k=U06F2iS

    } else {
        console.log('---信息来历不明---');
    }
})

// 创建公众号推广二维码（个人账号无此权限，测试号可用或者服务号）
wxCheckRouters.post('/getQrCode', async (req, res) => {
    // 参考 https://www.cnblogs.com/lxz123/p/15093004.html
    const { type } = req.query
    let data: IWXQrCodeCreateTemp = req.body;
    let ticketObj = await getQr_ticket(data);
    if ("errcode" in ticketObj) {
        return res.send(ticketObj);
    }
    const QRUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode` + (configs.wxServer ? "" : `?ticket=${ticketObj.ticket}`)
    switch (type) {
        case "image":
            res.send(await getImageFromUrl(QRUrl));
            // res.redirect(301, await getImageFromUrl(QRUrl)); // 不支持base64作为重定向链接
            // res.send(`<img src="${await getImageFromUrl(QRUrl)}" />`);
            break;

        default:
            res.send(ticketObj)
            break;
    }

})


function getQr_ticket(data: IWXQrCodeCreateTemp) {
    return new Promise<IWXError | IWXQrCodeRes>(async (resolve, reject) => {
        if (configs.wxServer) {
            const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create`;
            axios.post(url, data).then(({ data }) => {
                return resolve(data)
            })
        }
        let access_token = ACCESS_TOKEN_DATA.access_token;
        if ((enableTimestamp - transitionTime) < Date.now()) {
            const ATRes = await getAToken();
            if (ATRes.error) {
                resolve({
                    errcode: 1,
                    errmsg: "获取access_token失败"
                })
            } else {
                access_token = ATRes.data
            }
        }

        const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`;
        axios.post(url, data,).then(({ data }) => {
            resolve(data)
        })
    })
}

export { wxCheckRouters };
