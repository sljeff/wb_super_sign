// ==UserScript==
// @name         微博超级话题签到
// @namespace    https://www.kindjeff.com/
// @version      2017.1.5
// @description  在网页端自己的微博主页，把自己关注的超级话题一键全部签到。注意：只能在自己的个人主页签到。
// @author       kindJeff
// @match        http://weibo.com/*
// @match        http://www.weibo.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function get_topic_hash(response_text, page, user_id){
        var result = {};
        var hash_start_index, name_start_index, name_end_index, name, hash;

        var name_index = response_text.indexOf('screen_name=');
        while(name_index != -1){
            name_start_index = name_index + 12;
            name_end_index = response_text.indexOf('&', name_index);
            name = response_text.slice(name_start_index, name_end_index);
            hash = response_text.slice(name_index-56,name_index-56+38);
            result[name] = hash;
            name_index = response_text.indexOf('screen_name=', name_index + 100);
        }
        var next_index = response_text.indexOf('page next', name_end_index);
        if(next_index!==-1 && response_text.indexOf("Pl_Official_RelationInterested__99_page", next_index)!==-1){
            page += 1;
            var url = 'http://weibo.com/p/'+user_id+'/myfollow?pids=Pl_Official_RelationInterested__99&cfs=600&relate=interested&Pl_Official_RelationInterested__99_page='+page+'&ajaxpagelet=1&ajaxpagelet_v6=1&__ref=%2Fp%2F'+user_id+'%2Fmyfollow%3Frelate%3Dinterested%23place';
            var xhr_temp = new XMLHttpRequest();
            xhr_temp.open("GET", url, false);
            xhr_temp.send();
            var result_next_page = get_topic_hash(xhr_temp.responseText, page, user_id);
            Object.assign(result, result_next_page);
        }
        return result;
    }

    function sign(one_hash){
        var xmlhttp_sign = new XMLHttpRequest();
        var s1 = "http://weibo.com/p/aj/general/button";
        var s2 = "?ajwvr=6&api=http://i.huati.weibo.com/aj/supercheckin&texta=%E7%AD%BE%E5%88%B0&textb=%E5%B7%B2%E7%AD%BE%E5%88%B0&status=0&id=";
        var url = s1 + s2 + one_hash + "&location=page_100808_super_index";
        xmlhttp_sign.open("GET", url, false);
        xmlhttp_sign.send();
        var sign_result_str = xmlhttp_sign.responseText;
        var sign_result_obj = JSON.parse(sign_result_str);
        var info = sign_result_obj['data']['alert_title'];
        if(sign_result_obj['code']!='100000'){
            info = sign_result_obj['msg'];
        }
        return info;
    }

    function log_result(result_obj){
        // console.log(result_obj);
        for(var name in result_obj){
            console.log(name, result_obj[name]);
        }
        var s_b = document.getElementById("super_sign");
        s_b.innerText = "完成，按F12看结果";
    }

    function get_and_sign(){
        var user_id = document.getElementsByClassName('tab_link')[0].href.split('/')[4];
        var xmlhttp_get_list = new XMLHttpRequest();

        xmlhttp_get_list.onreadystatechange = function(){
            if(xmlhttp_get_list.readyState==4 && xmlhttp_get_list.status==200){
                var topic_hash = get_topic_hash(xmlhttp_get_list.responseText, 1, user_id);
                var sign_result = {};
                for(var name in topic_hash){
                    sign_result[name] = sign(topic_hash[name]);
                }
                log_result(sign_result);
            }
        };

        xmlhttp_get_list.open('GET', 'http://weibo.com/p/'+user_id+'/myfollow?relate=interested&pids=plc_main&ajaxpagelet=1&ajaxpagelet_v6=1&__ref=%2Fp%2F'+user_id+'%2Fmyfollow%3Frelate%3Dinterested%23place', true);
        xmlhttp_get_list.send();
    }


    function main(){
        var sign_block = document.createElement('li');
        sign_block.setAttribute('id', 'super_sign');
        sign_block.innerText="超级话题签到";
        sign_block.onmouseover = function(){sign_block.style.color='red';};
        sign_block.onmouseout = function(){sign_block.style.color='black';};

        sign_block.onclick = function(){
            if(document.getElementsByClassName('tab_link').length!==0 && document.getElementsByClassName('tab_link')[0].innerText=="我的主页"){
                sign_block.innerText="正在签到...";
                get_and_sign();
                sign_block.onclick='';
                sign_block.onmouseover='';
                sign_block.onmouseout='';
            }else{
                window.location = '/profile';
            }
        };
        var the_con = document.getElementsByClassName('gn_nav_list')[0];
        var game = document.getElementsByClassName('gn_nav_list')[0].children[3];
        the_con.removeChild(game);
        the_con.appendChild(sign_block);
    }

    var init_func = function(){
        setTimeout(main, 3000);
    };

    if (document.readyState != 'loading'){
        init_func();
    }else{
        document.addEventListener('DOMContentLoaded', init_func);
    }
})();
