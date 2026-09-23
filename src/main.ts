import "./style.css";

const message=document.querySelector<HTMLElement>("#message")!;
const scene=document.querySelector<HTMLElement>(".scene")!;
const exits=[{id:"rear-exit",label:"rear"},{id:"left-exit",label:"left"},{id:"right-exit",label:"right"}];

for(const exit of exits){
  document.querySelector<HTMLButtonElement>(`#${exit.id}`)?.addEventListener("click",async()=>{
    if(scene.classList.contains("transitioning"))return;
    message.textContent=`You open the ${exit.label} door. Darkness waits beyond.`;
    scene.classList.add("transitioning");
    await new Promise(r=>setTimeout(r,420));
    scene.classList.remove("transitioning");
    message.textContent="For now, the doorway leads back to this prototype room.";
  });
}