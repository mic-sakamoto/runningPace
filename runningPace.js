function buttonClick(){
    if(checkTimeAndDistance()){
        calcTime();
    };
}

function setDistance(value){
    document.getElementById("distance").value=value;
}

function setTime(value){
    document.getElementById("time").value=value;
}

function checkTimeAndDistance(){
    const timePattern=/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})$/;
    const timeValue=document.getElementById("time").value.trim();
    const distanceValue=parseFloat(document.getElementById("distance").value.trim());

    if(!timePattern.test(timeValue)){
        document.getElementById("alert").innerHTML="正しい時間形式（hh:mm:ss、mm:ss）で入力してください";
        return false;
    }

    if(isNaN(distanceValue)||distanceValue<=0){
        document.getElementById("alert").innerHTML="距離を正しく設定してください";
        return false;
    }

    document.getElementById("alert").innerHTML="";
    return true;
}

function calcTime(){
    var timeValueArray=document.getElementById("time").value.trim();
    var distance=parseFloat(document.getElementById("distance").value.trim());

    var totalSeconds=getSecondsFromTime(timeValueArray);

    // if(timeValueArray.length==3){
    //     var totalSeconds=parseInt(timeValueArray[0])*3600+parseInt(timeValueArray[1])*60+parseInt(timeValueArray[2]);
    // }else if(timeValueArray.length==2){
    //     totalSeconds=parseInt(timeValueArray[0])*60+parseInt(timeValueArray[1]);
    // }

    var pace=totalSeconds/distance;

    const temp=parseFloat(document.getElementById("temp").value);
    const humidity=parseFloat(document.getElementById("humidity").value);
    if(!isNaN(temp)&&!isNaN(humidity)){
        const adjustmentRate=((temp-15)*0.005)+((humidity-40)*0.001);
        pace*=(1+adjustmentRate);
        document.getElementById("adjustedPace").innerHTML=`補正後ペース（天候考慮）`;
    }else{
        document.getElementById("adjustedPace").innerHTML="";
    }

    var paces={
        perPace:calcPace(pace),
        jogPace:calcPace(pace*1.1),
        tempoPace:calcPace(pace*0.95),
        longIntervalPace:calcPace(pace*0.9),
        middleIntervalPace:calcPace(pace*0.85),
        shortIntervalPace:calcPace(pace*0.8)
    }

    document.getElementById("perPace").innerHTML="平均ペース："+paces.perPace;
    document.getElementById("jogPace").innerHTML="ジョグ："+paces.jogPace;
    document.getElementById("tempoPace").innerHTML="テンポ走："+paces.tempoPace;
    document.getElementById("longIntervalPace").innerHTML="ロングインターバル："+paces.longIntervalPace;
    document.getElementById("middleIntervalPace").innerHTML="ミドルインターバル："+paces.middleIntervalPace;
    document.getElementById("shortIntervalPace").innerHTML="ショートインターバル："+paces.shortIntervalPace;

    saveHistory(document.getElementById("time").value.trim(),distance,paces);
}

function calcPace(perPace){
    var minutes=Math.floor(perPace/60);
    var seconds=Math.floor(perPace%60);
    return minutes+"分"+seconds+"秒";
}

function predictPB(){
    const baseDist=parseFloat(document.getElementById("baseDistance").value);
    const targetDist=parseFloat(document.getElementById("targetDistance").value);
    const baseTimeStr=document.getElementById("baseTime").value.trim();

    const baseSec=getSecondsFromTime(baseTimeStr);
    if(isNaN(baseDist)||isNaN(targetDist)||baseSec===null){
        document.getElementById("pbPredictionResult").innerText="入力を確認してください";
        return;
    }

    const predictedSec=baseSec*Math.pow(targetDist/baseDist,1.06);
    const min=Math.floor(predictedSec/60);
    const sec=Math.round(predictedSec%60).toString().padStart(2,'0');
    const hr=Math.floor(min/60);
    const minAdjusted=min%60;

    const timeStr=hr>0 ? `${hr}:${minAdjusted.toString().padStart(2,'0')}:${sec}` : `${min}:${sec}`;
    document.getElementById("pbPredictionResult").innerText=`予測タイム：${timeStr}`;
}

function saveHistory(time,distance,paces){
    let history=JSON.parse(localStorage.getItem("paceHistory"))||[];
    history.unshift({time,distance,paces,date:new Date().toLocaleString()});
    localStorage.setItem("paceHistory",JSON.stringify(history));
    displayHistory();
}

function displayHistory(){
    let history=JSON.parse(localStorage.getItem("paceHistory"))||[];
    let historyDiv=document.getElementById("history");
    historyDiv.innerHTML=""

    history.forEach((entry,index)=>{
        let entryDiv=document.createElement("div");
        entryDiv.innerHTML=`<p>${entry.date}-${entry.time},${entry.distance}km</p>
            <p>平均ペース：${entry.paces.perPace}</p>
            <p>ジョグ：${entry.paces.jogPace}</p>
            <p>テンポ走:${entry.paces.tempoPace}</p>
            <p>ロングインターバル：${entry.paces.longIntervalPace}</p>
            <p>ミドルインターバル：${entry.paces.middleIntervalPace}</p>
            <p>ショートインターバル：${entry.paces.shortIntervalPace}</p>
            <button onclick="deleteHistory(${index})">削除</button>`;
        historyDiv.appendChild(entryDiv);
    });

    let clearButton=document.createElement("button");
    clearButton.innerText="全履歴削除";
    clearButton.onclick=deleteAllHistory;
    historyDiv.appendChild(clearButton);

    updatePaceChart(history);
}

function deleteHistory(index){
    let history=JSON.parse(localStorage.getItem("paceHistory"))||[];
    history.splice(index,1);
    localStorage.setItem("paceHistory",JSON.stringify(history));
    displayHistory();
}

function deleteAllHistory(){
    localStorage.removeItem("paceHistory");
    displayHistory();
}

let paceChart;

function updatePaceChart(history){
    const labels=history.map(entry=>entry.date).reverse();
    const data=history.map(entry=>{
        const paceStr=entry.paces.perPace;
        const match=paceStr.match(/(\d+)分(\d+)秒/);
        return match ? parseInt(match[1])*60+parseInt(match[2]):0;
    }).reverse();

    const ctx=document.getElementById('paceChart').getContext('2d');

    if(paceChart) paceChart.destroy();

    paceChart=new Chart(ctx,{
        type:'line',
        data:{
            labels:labels,
            datasets:[{
                label:'平均ペース（分:秒/km）',
                data:data,
                borderWidth:2,
                fill:false,
                tension:0.2
            }]
        },
        options:{
            responsive:true,
            scales:{
                y:{
                    title:{
                        display:true,
                        text:'ペース（分:秒/km）'
                    },
                    ticks:{
                        callback:function(value){
                            const minutes=Math.floor(value/60);
                            const seconds=Math.floor(value%60).toString().padStart(2,'0');
                            return `${minutes}:${seconds}`;
                        }
                    }
                },
                x:{
                    title:{
                        display:true,
                        text:'日付'
                    }
                }
            }
        }
    });
}

function savePB(type){
    const idMap={
        "1500m":"pb1500m",
        "5km":"pb5k",
        "10km":"pb10k",
        "half":"pbHalf",
        "full":"pbFull"
    };

    const input=document.getElementById(idMap[type]).value.trim();
    const seconds=getSecondsFromTime(input);
    if(seconds===null){
        alert("正しい時間形式（hh:mm:ssまたはmm:ss）で入力してください");
        return;
    }

    let pbData=JSON.parse(localStorage.getItem("personalBests"))||{};
    pbData[type]={time:input,seconds};
    localStorage.setItem("personalBests",JSON.stringify(pbData));

    updatePBChart();
}

function getSecondsFromTime(timeStr){
    const parts=timeStr.split(":").map(Number);
    if(parts.length===2){
        return parts[0]*60+parts[1];
    }else if(parts.length===3){
        return parts[0]*3600+parts[1]*60+parts[2];
    }else{
        return null;
    }
}

let pbChart;

function updatePBChart(){
    const pbData=JSON.parse(localStorage.getItem("personalBests"))||{};
    const labels=["1500m","5km","10km","half","full"];
    const secondsData=[
        pbData["1500m"]?.seconds||0,
        pbData["5km"]?.seconds||0,
        pbData["10km"]?.seconds||0,
        pbData["half"]?.seconds||0,
        pbData["full"]?.seconds||0
    ];

    const ctx=document.getElementById('pbChart').getContext('2d');

    if(pbChart)pbChart.destroy();

    pbChart=new Chart(ctx,{
        type:'bar',
        data:{
            labels:labels,
            datasets:[{
                label:'自己ベスト（分：秒）',
                data:secondsData,
                borderWidth:1
            }]
        },
        options:{
            responsive:true,
            scales:{
                y:{
                    title:{
                        display:true,
                        text:'タイム（分：秒）'
                    },
                    ticks:{
                        callback:function(value){
                            const minutes=Math.floor(value/60);
                            const seconds=(value%60).toString().padStart(2,'0');
                            return `${minutes}:${seconds}`;
                        }
                    }
                }
            }
        }
    })
}

function toggleDarkMode(){
    let body=document.getElementById("body");
    let isDarkMode=body.classList.toggle("dark-mode");

    localStorage.setItem("darkMode",isDarkMode);
}

window.onload=function(){
    if(localStorage.getItem("darkMode")==="true"){
        document.getElementById("body").classList.add("dark-mode");
    }

    displayHistory();

    updatePBChart();
}