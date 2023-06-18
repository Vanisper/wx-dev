import axios from 'axios';

export async function getImageFromUrl(url: string): Promise<string> {
    const response = await axios.get(url, {
        responseType: 'arraybuffer', // 指定响应类型为二进制数据
    });

    const data = Buffer.from(response.data, 'binary').toString('base64'); // 将二进制数据转化为 base64 编码字符串

    return `data:${response.headers['content-type']};base64,${data}`; // 拼接成可以在浏览器中渲染的 base64 字符串
}

