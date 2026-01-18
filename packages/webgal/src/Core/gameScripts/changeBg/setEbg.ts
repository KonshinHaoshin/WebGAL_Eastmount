export function setEbg(url: string) {
  const ebg = (document.getElementById('ebg') || document.querySelector('.html-body__effect-background')) as HTMLElement | null;
  if (ebg) {
    ebg.style.backgroundImage = `url("${url}")`;
  }
}