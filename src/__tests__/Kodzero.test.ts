import Kodzero from '../Kodzero.js';

it('should create an instance if host provided', async () => {
    const kodzero = new Kodzero({
        host: 'http://localhost:6969'
    });

    expect(kodzero).toBeInstanceOf(Kodzero);
});