export function splashTime(now=new Date()){
 return now.getHours()>=6&&now.getHours()<18?'day':'evening';
}
