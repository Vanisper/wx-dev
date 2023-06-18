import express from "express";
import config from "./config/app.json";
import { wxCheckRouters } from "./routes";

const app = express();
//设置允许跨域访问该服务.
app.all("*", function (req, res, next) {
    //设置允许跨域的域名，*代表允许任意域名跨域
    const allowedOrigins = config.allow.hosts;
    res.header('Access-Control-Allow-Origin', allowedOrigins);

    //允许的header类型
    res.header("Access-Control-Allow-Headers", "content-type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
    if (req.method.toLowerCase() == "options")
        res.send(200); //让options尝试请求快速结束
    else next();
});

// // 解析 application/json
// app.use(bodyParser.json());
// // 解析 application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded());
// 接收参数
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// 处理静态资源访问
app.use('/', express.static('html'));

app.use(wxCheckRouters);

app.listen(config.port, () => {
    console.clear();
    console.log("服务已运行于：http://127.0.0.1:" + config.port);
});
