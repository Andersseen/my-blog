import { Component, input } from "@angular/core";

@Component({
  selector: "app-blog-status",
  standalone: true,
  template: `<span
    class="rounded-full border border-primary-300 px-2 py-1 text-xs"
    >{{ label() }}</span
  >`,
})
export class BlogStatusComponent {
  public label = input<string>("Angular island ready");
}
