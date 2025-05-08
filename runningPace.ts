interface PaceSet{
    perPace:String;
    jogPace:string;
    tempoPace:string;
    longIntervalPace:string;
    middleIntervalPace:string;
    shortIntervalPace:string;
}

interface HistoryEntry{
    time:string;
    distance:number;
    paces:PaceSet;
    date:string;
}

interface PBData{
    [key:string]:{time:string;seconds:number};
}

let paceChart:Chart | null=null;
let pbChart:Chart | null=null;

function buttonClick():void{
    if(checkTimeAndDistance()){
        calcTime();
    }
}

function setDistance(value:number):void{
    (document.getElementById("distance") as HTMLInputElement).value=value.toString();
}

function setTime(value:string):void{
    (document.getElementById("time") as HTMLInputElement).value=value;
}

function checkTimeAndDistance():boolean{
    const timePattern=/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})$/;
    const timeValue=(document.getElementById("time") as HTMLInputElement).value.trim();
    const distanceValue=parseFloat((document.getElementById("distance") as HTMLInputElement).value.trim());
    const alertDiv=document.getElementById("alert")!;

    if(!timePattern.test(timeValue)){
        alertDiv.innerHTML="正しい時間形式(hh:mm:ss,mm:ss)で入力してください";
        return false;
    }

    if(isNaN(distanceValue)||distanceValue<=0){
        alertDiv.innerHTML="距離を正しく設定してください";
        return false;
    }

    alertDiv.innerHTML="";
    return true;
}