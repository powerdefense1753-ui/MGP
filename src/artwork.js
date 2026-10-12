import rome from './art/rome.svg?raw';
import jade from './art/jade.svg?raw';
import space from './art/space.svg?raw';
import forest from './art/forest.svg?raw';
import north from './art/north.svg?raw';
import japan from './art/japan.svg?raw';
import modern from './art/modern.svg?raw';
import castle from './art/castle.svg?raw';
export const artwork = Object.fromEntries(Object.entries({rome,jade,space,forest,north,japan,modern,castle}).map(([key,svg])=>[key,`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`]));
