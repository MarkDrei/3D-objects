import { gallery } from './gallery';
import {
  createStreetLamp, createTrafficLight, createHydrant, createMailbox, createTrashCan, createPhoneBooth,
  createBusStop, createBikeRack, createNewsKiosk, createBillboard,
} from './city-furniture';
import {
  createDonutShop, createPizzeria, createCafe, createGasStation, createCarWash, createFireStation,
  createWaterTower, createCinema, createRadioTower, createHelipad,
} from './city-buildings';
import {
  createPerson, createCow, createPig, createChicken, createSheep, createDog,
  createBarn, createWindmill, createScarecrow, createHayBale,
} from './city-life';
import {
  createGiantRobot, createBasketballCourt, createSkatePark, createSwimmingPool, createTrampoline,
  createFoodTruck, createGiantCat, createNeonSign, createStreetMusician, createFortuneTeller, createGumballMachine,
} from './city-fun';

export * from './city-furniture';
export * from './city-buildings';
export * from './city-life';
export * from './city-fun';

gallery({
  // street furniture
  streetLamp: () => createStreetLamp(),
  trafficLight: () => {
    const o = createTrafficLight();
    const states = ['red', 'yellow', 'green'] as const;
    let i = 0;
    setInterval(() => o.userData.setState(states[i++ % 3]), 1000);
    return o;
  },
  hydrant: () => createHydrant(),
  mailbox: () => createMailbox(),
  trashCan: () => createTrashCan(),
  phoneBooth: () => createPhoneBooth(),
  busStop: () => createBusStop(),
  bikeRack: () => createBikeRack(),
  newsKiosk: () => createNewsKiosk(),
  billboard: () => createBillboard(),
  neonSign: () => createNeonSign(),
  // buildings
  donutShop: () => createDonutShop(),
  pizzeria: () => createPizzeria(),
  cafe: () => createCafe(),
  gasStation: () => createGasStation(),
  carWash: () => createCarWash(),
  fireStation: () => createFireStation(),
  waterTower: () => createWaterTower(),
  cinema: () => createCinema(),
  radioTower: () => createRadioTower(),
  helipad: () => createHelipad(),
  // fun
  giantRobot: () => createGiantRobot(),
  basketballCourt: () => createBasketballCourt(),
  skatePark: () => createSkatePark(),
  swimmingPool: () => createSwimmingPool(),
  trampoline: () => createTrampoline(),
  foodTruck: () => createFoodTruck('taco'),
  foodTruckHotdog: () => createFoodTruck('hotdog'),
  giantCat: () => createGiantCat(),
  streetMusician: () => createStreetMusician(),
  fortuneTeller: () => createFortuneTeller(),
  gumballMachine: () => createGumballMachine(),
  // farm + life
  barn: () => createBarn(),
  windmill: () => createWindmill(),
  scarecrow: () => createScarecrow(),
  hayBale: () => createHayBale(),
  cow: () => createCow(1),
  pig: () => createPig(),
  chicken: () => createChicken(),
  sheep: () => createSheep(),
  dog: () => createDog(1),
  person: () => createPerson(1, { walkSpeed: 1 }),
  people: () => {
    const o = createPerson(Math.floor(Math.random() * 1000));
    return o;
  },
});
