export interface IWXError {
    errcode: number,
    errmsg: string
}

export interface IWXTicketRes {
    errcode: number,
    errmsg: 'ok',
    ticket: string,
    expires_in: 7200
}

export interface IWXQrCodeRes {
    ticket: string,
    expire_seconds: number,
    url: string
}
/**
 * 临时二维码请求
 */
export interface IWXQrCodeCreateTemp {
    expire_seconds: 604800 | number,
    action_name: "QR_SCENE",
    action_info: {
        scene: {
            /**
             * 	场景值ID，临时二维码时为32位非0整型，永久二维码时最大值为100000（目前参数只支持1--100000）
             */
            scene_id: number
        } | {
            /**
             * 场景值ID（字符串形式的ID），字符串类型，长度限制为1到64
             */
            scene_str: string
        }
    }
}
/**
 * 永久二维码请求
 */
export interface IWXQrCodeCreate {
    action_name: "QR_LIMIT_SCENE",
    action_info: {
        scene: {
            /**
             * 	场景值ID，临时二维码时为32位非0整型，永久二维码时最大值为100000（目前参数只支持1--100000）
             */
            scene_id: number
        } | {
            /**
             * 场景值ID（字符串形式的ID），字符串类型，长度限制为1到64
             */
            scene_str: string
        }
    }
}