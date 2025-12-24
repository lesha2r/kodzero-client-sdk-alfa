import Kodzero from '../Kodzero.js';

it('should create an instance if host provided', async () => {
    const kodzero = new Kodzero({
        host: 'http://localhost:6969',
        collection: "_auth_"
    });

    expect(kodzero).toBeInstanceOf(Kodzero);
});