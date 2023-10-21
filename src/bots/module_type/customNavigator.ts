export class CustomNavigator {
  private _webdriver: boolean = false;
  private _languages: string[] = ["en-US", "en"];
  private _plugins: number[] = [1, 2, 3, 4, 5];

  get webdriver(): boolean {
    return this._webdriver;
  }
  set webdriver(value: boolean) {
    this._webdriver = value;
  }

  get languages(): string[] {
    return this._languages;
  }
  set languages(value: string[]) {
    this._languages = value;
  }

  get plugins(): number[] {
    return this._plugins;
  }
  set plugins(value: number[]) {
    this._plugins = value;
  }
}
