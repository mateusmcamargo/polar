import Image from "next/image";
import type { StatementImage } from "@polar/db/editorial";
import styles from "./OldPrint.module.scss";

// A photo that looks like a ticket hanging from an instant printer: the mouth of the printer behind the top of the photo, the
// photo with a light old ink filter (halftone dots, ink stains and grain that fade in from the edges), a perforated line with
// a half circle cut on each side, and below it the detachable stub with the caption on ruled white paper, which ends in a
// serrated tear-off edge. The cuts are real: they are masked out of the paper, and the black edge and the offset shadow are drawn
// from the shape that is left, so they follow every cut exactly. The photo is never blurred, resized or recolored: the layers over
// it are light and thin, so its details stay as clear as in the file. When it comes into view the ticket is printed: it comes out
// of the mouth in pushes with a pause after each one (data-reveal="print").
export function OldPrint({ image }: Readonly<{ image: StatementImage }>) {
    return (
        <figure className={styles.print}>
            <div className={styles.mouth} aria-hidden="true" />
            <div className={styles.tray}>
                <div className={styles.shape} data-reveal="print">
                    <div className={styles.ticket}>
                        <div className={styles.photo}>
                            <Image src={image.file} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 600px) 320px, 80vw" />
                        </div>
                        <figcaption className={styles.stub}>
                            <div className={styles.stubBody}>
                                {image.caption} Foto: <a href={image.sourceUrl}>{image.author}</a>, licença {image.license}, via Wikimedia Commons.
                            </div>
                        </figcaption>
                    </div>
                </div>
            </div>
        </figure>
    );
}