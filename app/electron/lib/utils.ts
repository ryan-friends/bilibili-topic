export async function delay() {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
}
