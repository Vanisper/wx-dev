import { Router } from "express";
import axios, { AxiosError } from "axios";
import { kuwo } from "../../../config/music_api.json";
import { getMp3Url } from "../download";

const searchRoutes = Router();
const searchBaseUrl = kuwo.search.url;
const searchHearders = kuwo.search.headers;
const searchParams = kuwo.search.params;
const searchRidBaseUrl = kuwo.search_rid.url;
const searchRidHearders = kuwo.search_rid.headers;
const searchRidParams = kuwo.search_rid.params;
interface musicInfo {
    name: string;
    artist: string;
    rid: number;
    pic: string;
    album: string;
    albumpic: string;
    mp3Url: string;
}
interface musicInfoDetail {
    name: string;
    artist: string;
    artistid: number;
    rid: number;
    pic: string;
    pic120: string;
    album: string;
    albumid: number;
    albumpic: string;
    albuminfo: string;
    mp3Url: string;
    releaseDate: string; // 发行日期
    songTimeMinutes: string; // 时长
    hasmv: number;
    mvInfos: {
        vid: number;
        mvPlayCnt: number; // 播放量
        mp4Url: string;
    };
}

searchRoutes.get("/search", async (req, res) => {
    const { kw, format, rid } = req.query;

    if (kw != undefined && rid == undefined) {
        const { msg, list } = await searchMusic(kw as string);
        const nList: musicInfo[] = [];
        const names = list.map((item) => item.name);
        const artists = list.map((item) => item.artist);
        const rids = list.map((item) => item.rid);
        const pics = list.map((item) => item.pic);
        const albums = list.map((item) => item.album);
        const albumpics = list.map((item) => item.albumpic);

        const mp3Url: string[] = await Promise.all(
            list.map(async (item, index) => {
                list[index].mp3Url = (await getMp3Url(item.rid)).mp3Url;
                return (await getMp3Url(item.rid)).mp3Url;
            })
        );
        list.forEach((item) => {
            nList.push({
                name: item.name,
                artist: item.artist,
                rid: item.rid,
                pic: item.pic,
                album: item.album,
                albumpic: item.albumpic,
                mp3Url: item.mp3Url,
            });
        });

        if (format != undefined) {
            res.send(nList);
            return;
        }
        res.send({
            names,
            artists,
            rids,
            pics,
            albums,
            albumpics,
            mp3Url,
        });
    } else if (rid != undefined) {
        const { infos } = await searchRid(rid as string);
        res.send(infos);
    } else {
        res.send("请求参数不正确");
    }
});

const searchMusic = async (kw: string) => {
    searchParams.key = kw;
    let status: number | string | undefined = 200;
    let msg: string = "";
    let list: musicInfo[] = [];
    await axios
        .get(searchBaseUrl, { headers: searchHearders, params: searchParams })
        .then((res) => {
            status = res.status;
            msg = res.data.msg;
            list = res.data.data.list;
        })
        .catch((error: AxiosError) => {
            status = error.code;
            msg = error.message;
        });

    return {
        status,
        msg,
        list,
    };
};

const searchRid = async (rid: string) => {
    searchRidParams.mid = rid;
    let status: number | string | undefined = 200;
    let msg: string = "";
    let infos: musicInfoDetail = {
        name: "",
        artist: "",
        rid: 0,
        pic: "",
        pic120: "",
        album: "",
        albumpic: "",
        mp3Url: "",
        artistid: 0,
        albumid: 0,
        albuminfo: "",
        releaseDate: "",
        songTimeMinutes: "",
        hasmv: 0,
        mvInfos: {
            vid: 0,
            mvPlayCnt: 0,
            mp4Url: "",
        },
    };
    await axios
        .get(searchRidBaseUrl, {
            headers: searchRidHearders,
            params: searchRidParams,
        })
        .then(async (res) => {
            status = res.status;
            msg = res.data.msg;
            infos.name = res.data.data.name;
            infos.artist = res.data.data.artist;
            infos.rid = res.data.data.rid;
            infos.pic = res.data.data.pic;
            infos.pic120 = res.data.data.pic120;
            infos.album = res.data.data.album;
            infos.albumpic = res.data.data.albumpic;
            infos.mp3Url = (await getMp3Url(+rid)).mp3Url;
            infos.artistid = res.data.data.artistid;
            infos.albumid = res.data.data.albumid;
            infos.albuminfo = res.data.data.albuminfo;
            infos.releaseDate = res.data.data.releaseDate;
            infos.songTimeMinutes = res.data.data.songTimeMinutes;
            infos.hasmv = res.data.data.hasmv;
            infos.mvInfos = {
                vid: res.data.data.mvpayinfo.vid,
                mvPlayCnt: res.data.data.mvPlayCnt,
                mp4Url: (await getMp3Url(+rid, "mp4")).mp3Url,
            };
        })
        .catch((error: AxiosError) => {
            status = error.code;
            msg = error.message;
        });

    return {
        status,
        msg,
        infos,
    };
};

export { searchRoutes };
