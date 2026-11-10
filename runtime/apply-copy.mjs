export function applyCopy(root,labels){
  for(const [selector,text]of Object.entries(labels)){
    const node=root.querySelector(selector);if(!node)throw Error('Missing UI copy target '+selector);node.textContent=text;
  }
}
