import { Request } from "express";
import { parseString } from "xml2js";

export function getXMLStr(req: Request) {
    return new Promise<string>((resolve, reject) => {
        let data = '';
        // 以流的形式接收微信服务器发过来的数据
        req.on('data', (msg) => {
            // data 流是二进制的数据，要通过data.toString()转化为字符串
            data += msg.toString()
        })
        // 监听数据结束
        req.on('end', () => {
            resolve(data)
        })
    })
}


export function getJsData(data: string) {
    return new Promise<{
        xml: Record<string, Array<string>>
    }>((resolve, reject) => {
        parseString(data, (err, result) => {
            if (!err) {
                resolve(result)
            } else {
                reject('error')
            }
        })
    })
}

export function getObjData(obj: Record<string, string[]>) {
    let tempObj: Record<string, string> = {}
    if (obj && typeof obj === 'object') {
        // 循环对象，提取数据
        for (let key in obj) {
            let value = obj[key]
            if (value && value.length > 0) {
                tempObj[key] = value[0]
            }
        }
        return tempObj;
    } else {
        return tempObj;
    }
}